import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(req: NextRequest): Promise<{ id: number; email: string } | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const userRes = await query(
      `SELECT id, email FROM public.users WHERE id = $1 LIMIT 1`,
      [decoded.id]
    );
    if (userRes.rowCount === 0) return null;
    return userRes.rows[0];
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(`
      SELECT 
        a.id AS atendimento_id,
        a.tipo,
        a.status_proposta AS status,
        a.valor_proposta AS valor,
        a.mensagem,
        a.condicoes,
        a.created_at,
        p.id AS property_id,
        p.nome AS property_name,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) AS photo,
        (SELECT COUNT(m.id)::int FROM public.atendimento_mensagens m WHERE m.atendimento_id = a.id AND m.sender_type = 'corretor' AND m.lida = FALSE) AS unread_messages
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      WHERE (a.user_id = $1 OR a.email = $2)
      ORDER BY a.created_at DESC
    `, [user.id, user.email]);

    return NextResponse.json({ success: true, chats: res.rows });
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}
