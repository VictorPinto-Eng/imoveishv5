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

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(`
      SELECT 
        l.id as lead_id,
        l.mensagem,
        l.created_at,
        p.id as property_id,
        p.nome as property_name,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome,
        COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) as photo
      FROM public.leads l
      JOIN public.produto_servico p ON l.produto_servico_id = p.id
      LEFT JOIN public.imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON p.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON p.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
      LEFT JOIN public.apocidade CID ON p.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON p.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON p.estado_id = EST.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `, [userId]);

    return NextResponse.json({ success: true, messages: res.rows });
  } catch (error: any) {
    console.error('Error fetching user messages:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico de mensagens' }, { status: 500 });
  }
}
