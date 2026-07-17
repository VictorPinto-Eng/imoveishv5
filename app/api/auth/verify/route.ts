
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token de verificação ausente.' }, { status: 400 });
  }

  try {
    // Check if token exists and get user (SEC-20: incluir expiração)
    const result = await query(
      'SELECT id, email, verification_token_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
    }

    const user = result.rows[0];

    // SEC-20: Verificar expiração do token (se a coluna existir e tiver valor)
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado. Solicite um novo e-mail de verificação.' },
        { status: 400 }
      );
    }

    // Update user: verify email and clear token
    await query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE verification_token = $1',
      [token]
    );

    // Redirect to home with success message or a dedicated success page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imoveis.hv5.com.br';
    return NextResponse.redirect(`${appUrl}/?activated=true`);

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar conta. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
