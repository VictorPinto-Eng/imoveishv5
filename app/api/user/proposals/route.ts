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

// GET: Retrieve user proposals
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(`
      SELECT 
        pr.id as proposal_id,
        pr.valor,
        pr.condicoes,
        pr.status,
        pr.created_at,
        p.id as property_id,
        p.nome as property_name,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome,
        COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) as photo
      FROM public.propostas pr
      JOIN public.produto_servico p ON pr.produto_servico_id = p.id
      LEFT JOIN public.imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON p.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON p.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
      LEFT JOIN public.apocidade CID ON p.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON p.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON p.estado_id = EST.id
      WHERE pr.user_id = $1
      ORDER BY pr.created_at DESC
    `, [userId]);

    return NextResponse.json({ success: true, proposals: res.rows });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Erro ao buscar propostas' }, { status: 500 });
  }
}

// POST: Submit a proposal
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Você precisa estar logado para enviar uma proposta.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, valor, condicoes, nome, email, telefone } = body;

    if (!propertyId || !valor) {
      return NextResponse.json({ error: 'ID do imóvel e Valor são obrigatórios.' }, { status: 400 });
    }

    // Insert new proposal
    const result = await query(`
      INSERT INTO public.propostas (user_id, produto_servico_id, valor, condicoes, nome, email, telefone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userId, 
      Number(propertyId), 
      Number(valor), 
      condicoes || '', 
      nome || null, 
      email || null, 
      telefone || null
    ]);

    return NextResponse.json({ success: true, proposal: result.rows[0], message: 'Proposta enviada com sucesso!' });
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Erro ao enviar proposta.' }, { status: 500 });
  }
}
