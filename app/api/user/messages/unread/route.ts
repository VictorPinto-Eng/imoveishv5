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
    return NextResponse.json({ success: true, unreadCount: 0 }); // Safe fallback
  }

  try {
    // Get the user's email
    const userEmailCheck = await query(`SELECT email FROM public.users WHERE id = $1`, [userId]);
    const userEmail = userEmailCheck.rows[0]?.email || '';

    // Count unread messages sent by corretor for the client's atendimentos
    const countRes = await query(`
      SELECT COUNT(m.id)::int as unread_count
      FROM public.atendimento_mensagens m
      JOIN public.atendimento a ON m.atendimento_id = a.id
      WHERE (a.user_id = $1 OR (a.email IS NOT NULL AND LOWER(a.email) = LOWER($2)))
        AND m.sender_type = 'corretor'
        AND m.lida = FALSE
    `, [userId, userEmail]);

    const unreadCount = countRes.rows[0]?.unread_count || 0;

    return NextResponse.json({
      success: true,
      unreadCount
    });

  } catch (error: any) {
    console.error('Error fetching unread messages count:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
