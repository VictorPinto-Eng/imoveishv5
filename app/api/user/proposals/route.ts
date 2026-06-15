import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(req: NextRequest): Promise<{ id: number; name: string; email: string; phone?: string; social_name?: string } | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const userRes = await query(
      `SELECT id, name, email, phone, social_name FROM public.users WHERE id = $1 LIMIT 1`,
      [decoded.id]
    );
    if (userRes.rowCount === 0) return null;
    return userRes.rows[0];
  } catch {
    return null;
  }
}

// GET: Retrieve proposals submitted by the logged-in user (from public.atendimento)
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(`
      SELECT 
        a.id AS proposal_id,
        a.valor_proposta AS valor,
        a.condicoes,
        a.mensagem,
        a.tipo,
        a.status_proposta AS status,
        a.created_at,
        p.id AS property_id,
        p.nome AS property_name,
        OP.descricao AS operacao_nome,
        TP.descricao AS tipo_nome,
        CID.descricao AS cidade_nome,
        BAI.descricao AS bairro_nome,
        EST.sigla AS uf_nome,
        COALESCE(PL.preco_base, PV.preco_base, 0) AS preco_base,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) AS photo,
        (SELECT COUNT(m.id)::int FROM public.atendimento_mensagens m WHERE m.atendimento_id = a.id AND m.sender_type = 'corretor' AND m.lida = FALSE) AS unread_messages
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      LEFT JOIN public.imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON p.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON p.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
      LEFT JOIN public.apocidade CID ON p.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON p.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON p.estado_id = EST.id
      WHERE (a.user_id = $1 OR a.email = $2)
        AND a.tipo = 'proposta'
      ORDER BY a.created_at DESC
    `, [user.id, user.email]);

    return NextResponse.json({ success: true, proposals: res.rows });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Erro ao buscar propostas' }, { status: 500 });
  }
}

// POST: Submit a proposal intention — creates an atendimento card (tipo='proposta', etapa='novo')
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Você precisa estar logado para enviar uma proposta.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, valor, condicoes } = body;

    if (!propertyId || !valor) {
      return NextResponse.json({ error: 'ID do imóvel e Valor são obrigatórios.' }, { status: 400 });
    }

    const numericValor = Number(valor);
    if (isNaN(numericValor) || numericValor <= 0) {
      return NextResponse.json({ error: 'Valor da proposta inválido.' }, { status: 400 });
    }

    // Verify property exists
    const propRes = await query(
      `SELECT id, nome FROM public.produto_servico WHERE id = $1`,
      [Number(propertyId)]
    );
    if (propRes.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
    }

    const mensagem = `Intenção de proposta recebida pelo site. Valor proposto: R$ ${numericValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

    const result = await query(`
      INSERT INTO public.atendimento (
        user_id, produto_servico_id, nome, email, telefone,
        mensagem, tipo, valor_proposta, condicoes, status_proposta, etapa_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        'proposta', $7, $8, 'pendente',
        (SELECT id FROM public.atendimento_etapa WHERE sigla = 'novo' LIMIT 1)
      )
      RETURNING 
        id AS proposal_id,
        valor_proposta AS valor,
        condicoes,
        status_proposta AS status,
        created_at
    `, [
      user.id,
      Number(propertyId),
      user.social_name || user.name,
      user.email,
      user.phone || null,
      mensagem,
      numericValor,
      condicoes || ''
    ]);

    return NextResponse.json({
      success: true,
      proposal: result.rows[0],
      message: 'Proposta enviada com sucesso!'
    });
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Erro ao enviar proposta.' }, { status: 500 });
  }
}
