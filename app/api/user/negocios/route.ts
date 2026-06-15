import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// GET: Fetch all service records (atendimentos) for the advertiser's properties
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const atendimentosRes = await query(`
      SELECT 
        a.id as atendimento_id,
        a.id as proposal_id,
        a.valor_proposta as valor,
        a.condicoes,
        a.status_proposta as status,
        COALESCE(ae.sigla, 'novo') as etapa,
        a.tipo,
        a.mensagem,
        COALESCE(u.name, a.nome) as sender_name,
        u.social_name as sender_social_name,
        a.email as sender_email,
        a.telefone as sender_phone,
        a.anotacoes_internas,
        a.data_visita,
        a.data_agendamento,
        a.created_at,
        p.id as property_id,
        p.nome as property_name,
        op.descricao as operacao_nome,
        tp.descricao as tipo_nome,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) as photo
      FROM public.atendimento a
      LEFT JOIN public.atendimento_etapa ae ON a.etapa_id = ae.id
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      LEFT JOIN public.imbtpoperacao op ON p.imbtpoperacao_id = op.id
      LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
      LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
      LEFT JOIN public.imbtpimovel tp ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = tp.id
      LEFT JOIN public.users u ON a.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY a.created_at DESC
    `, [userId]);

    // 3. Get active funnel stages
    const etapasRes = await query(`
      SELECT nome, sigla, ordem 
      FROM public.atendimento_etapa 
      WHERE ativo = true 
      ORDER BY ordem ASC
    `);

    return NextResponse.json({
      success: true,
      atendimentos: atendimentosRes.rows,
      etapas: etapasRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching received business data:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados de negócios' }, { status: 500 });
  }
}

// PUT: Update stage, status, or notes of a specific service record (atendimento)
export async function PUT(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { proposalId, status, etapa, anotacoesInternas, dataVisita, dataAgendamento } = await req.json();

    if (!proposalId) {
      return NextResponse.json({ error: 'ID do atendimento é obrigatório' }, { status: 400 });
    }

    // Fetch existing state for transition logging
    const existingRes = await query(`
      SELECT a.status_proposta, ae.sigla as etapa, a.data_visita, a.data_agendamento, a.anotacoes_internas
      FROM public.atendimento a
      LEFT JOIN public.atendimento_etapa ae ON a.etapa_id = ae.id
      WHERE a.id = $1
    `, [Number(proposalId)]);
    
    const existing = existingRes.rows[0];

    const fieldsToUpdate: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      const cleanStatus = status ? status.toLowerCase() : 'pendente';
      if (!['pendente', 'aceita', 'recusada'].includes(cleanStatus)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
      }
      fieldsToUpdate.push(`status_proposta = $${paramIndex++}`);
      queryParams.push(cleanStatus);
    }

    if (etapa !== undefined) {
      const cleanEtapa = etapa.toLowerCase();
      if (!['novo', 'contato', 'agendamento', 'proposta', 'fechamento'].includes(cleanEtapa)) {
        return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 });
      }
      fieldsToUpdate.push(`etapa_id = (SELECT id FROM public.atendimento_etapa WHERE sigla = $${paramIndex++} LIMIT 1)`);
      queryParams.push(cleanEtapa);
    }

    if (anotacoesInternas !== undefined) {
      fieldsToUpdate.push(`anotacoes_internas = $${paramIndex++}`);
      queryParams.push(anotacoesInternas);
    }

    if (dataVisita !== undefined) {
      fieldsToUpdate.push(`data_visita = $${paramIndex++}`);
      queryParams.push(dataVisita ? new Date(dataVisita) : null);
      
      // Also automatically update data_agendamento when data_visita is provided
      fieldsToUpdate.push(`data_agendamento = $${paramIndex++}`);
      queryParams.push(dataVisita ? new Date(dataVisita) : null);
    } else if (dataAgendamento !== undefined) {
      fieldsToUpdate.push(`data_agendamento = $${paramIndex++}`);
      queryParams.push(dataAgendamento ? new Date(dataAgendamento) : null);
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo informado para atualização' }, { status: 400 });
    }

    queryParams.push(Number(proposalId));
    const idParamIndex = paramIndex++;

    queryParams.push(userId);
    const userParamIndex = paramIndex++;

    const queryText = `
      UPDATE public.atendimento
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${idParamIndex} AND produto_servico_id IN (
        SELECT id FROM public.produto_servico WHERE user_id = $${userParamIndex}
      )
      RETURNING *
    `;

    const res = await query(queryText, queryParams);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Atendimento não encontrado ou você não tem permissão para alterá-lo' }, { status: 404 });
    }

    // LOG TRANSITIONS
    const currentEtapa = res.rows[0].etapa_id ? (await query(`SELECT sigla FROM public.atendimento_etapa WHERE id = $1`, [res.rows[0].etapa_id])).rows[0]?.sigla : 'novo';

    if (etapa && existing && existing.etapa !== etapa.toLowerCase()) {
      await query(`
        INSERT INTO public.atendimento_log (atendimento_id, user_id, etapa_anterior, etapa_nova, descricao)
        VALUES ($1, $2, $3, $4, $5)
      `, [Number(proposalId), userId, existing.etapa || 'novo', etapa.toLowerCase(), `Etapa alterada de ${existing.etapa || 'novo'} para ${etapa.toLowerCase()}.`]);
    }

    if (status && existing && existing.status_proposta !== status.toLowerCase()) {
      await query(`
        INSERT INTO public.atendimento_log (atendimento_id, user_id, etapa_anterior, etapa_nova, descricao)
        VALUES ($1, $2, $3, $3, $4)
      `, [Number(proposalId), userId, existing.etapa || 'novo', `Status da proposta atualizado para "${status.toLowerCase()}".`]);
    }

    if (dataVisita !== undefined && existing) {
      const oldTime = existing.data_visita ? new Date(existing.data_visita).getTime() : 0;
      const newTime = dataVisita ? new Date(dataVisita).getTime() : 0;
      if (oldTime !== newTime) {
        const desc = dataVisita 
          ? `Visita agendada para ${new Date(dataVisita).toLocaleString('pt-BR')}.`
          : `Agendamento de visita cancelado/removido.`;
        await query(`
          INSERT INTO public.atendimento_log (atendimento_id, user_id, etapa_anterior, etapa_nova, descricao)
          VALUES ($1, $2, $3, $3, $4)
        `, [Number(proposalId), userId, existing.etapa || 'novo', desc]);
      }
    }

    if (dataAgendamento !== undefined && existing && dataVisita === undefined) {
      const oldTime = existing.data_agendamento ? new Date(existing.data_agendamento).getTime() : 0;
      const newTime = dataAgendamento ? new Date(dataAgendamento).getTime() : 0;
      if (oldTime !== newTime) {
        const desc = dataAgendamento 
          ? `Agendamento do card definido para ${new Date(dataAgendamento).toLocaleString('pt-BR')}.`
          : `Agendamento do card cancelado/removido.`;
        await query(`
          INSERT INTO public.atendimento_log (atendimento_id, user_id, etapa_anterior, etapa_nova, descricao)
          VALUES ($1, $2, $3, $3, $4)
        `, [Number(proposalId), userId, existing.etapa || 'novo', desc]);
      }
    }

    if (anotacoesInternas !== undefined && existing && existing.anotacoes_internas !== anotacoesInternas) {
      await query(`
        INSERT INTO public.atendimento_log (atendimento_id, user_id, etapa_anterior, etapa_nova, descricao)
        VALUES ($1, $2, $3, $3, $4)
      `, [Number(proposalId), userId, existing.etapa || 'novo', `Anotações internas atualizadas.`]);
    }

    return NextResponse.json({ success: true, atendimento: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating atendimento status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar atendimento' }, { status: 500 });
  }
}

// POST: Register a new manual lead/atendimento
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, propertyId, value, conditions, operationType, etapa } = body;

    if (!name || !propertyId) {
      return NextResponse.json({ error: 'Nome do Lead e Imóvel são obrigatórios' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

    // 1. Verify property ownership
    const propRes = await query(
      `SELECT id, nome FROM public.produto_servico WHERE id = $1 AND user_id = $2`,
      [Number(propertyId), userId]
    );

    if (propRes.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel inválido ou sem permissão.' }, { status: 403 });
    }

    const initialEtapa = etapa || 'novo';
    const cleanEtapa = ['novo', 'contato', 'agendamento', 'proposta', 'fechamento'].includes(String(initialEtapa).toLowerCase())
      ? String(initialEtapa).toLowerCase()
      : 'novo';

    const tipo = (value && Number(value) > 0) ? 'proposta' : 'contato';
    const finalidadeText = operationType === 'locacao' ? 'Locação' : 'Venda';
    const leadMsg = `Cadastrado manualmente via painel de Negócios. Tipo: ${finalidadeText}.`;

    // Try to resolve client user_id by email
    let clientUserId = null;
    if (email) {
      const userRes = await query(`SELECT id FROM public.users WHERE email = $1 LIMIT 1`, [email]);
      if (userRes.rowCount > 0) {
        clientUserId = userRes.rows[0].id;
      }
    }

    // 2. Insert into public.atendimento
    const insertResult = await query(`
      INSERT INTO public.atendimento (
        user_id, produto_servico_id, nome, email, telefone, mensagem, 
        tipo, valor_proposta, condicoes, status_proposta, etapa_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, (SELECT id FROM public.atendimento_etapa WHERE sigla = $11 LIMIT 1))
      RETURNING id as atendimento_id, id as proposal_id, valor_proposta as valor, condicoes, status_proposta as status, 
                (SELECT sigla FROM public.atendimento_etapa WHERE id = etapa_id) as etapa, 
                tipo, mensagem, nome as sender_name, email as sender_email, telefone as sender_phone, created_at, produto_servico_id as property_id
    `, [
      clientUserId,
      Number(propertyId),
      name,
      email || null,
      cleanPhone,
      leadMsg,
      tipo,
      value ? Number(value) : 0,
      conditions || '',
      'pendente',
      cleanEtapa
    ]);

    const newId = insertResult.rows[0].atendimento_id;

    // Log the initial creation
    await query(`
      INSERT INTO public.atendimento_log (
        atendimento_id, user_id, etapa_anterior, etapa_nova, descricao
      )
      VALUES ($1, $2, null, $3, $4)
    `, [newId, userId, cleanEtapa, 'Oportunidade cadastrada manualmente.']);

    return NextResponse.json({
      success: true,
      message: 'Atendimento cadastrado com sucesso!',
      atendimento: insertResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error registering manual lead/atendimento:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar lead/atendimento' }, { status: 500 });
  }
}
