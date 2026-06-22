import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

interface AdminVerifyResult {
  authorized: boolean;
  userId?: number;
  response?: NextResponse;
}

/**
 * SEC-05: Verifica admin re-consultando o banco a cada request.
 * Não confia apenas no claim JWT (que pode estar stale por até 24h após revogação).
 */
export async function verifyAdmin(req: NextRequest): Promise<AdminVerifyResult> {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    };
  }

  let decoded: { id: number; is_admin?: boolean };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 }),
    };
  }

  // Re-verifica no banco — garante que revogação de admin é imediata
  const adminCheck = await query(
    'SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = $1) as is_admin',
    [decoded.id]
  );

  if (!adminCheck.rows[0]?.is_admin) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Proibido' }, { status: 403 }),
    };
  }

  return { authorized: true, userId: decoded.id };
}