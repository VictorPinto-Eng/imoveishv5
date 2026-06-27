
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // SEC-07: Rate limiting — 3 tentativas por 10 minutos (envio de email)
        const rateLimited = checkRateLimit(request, '/api/auth/resend-verification', 'email');
        if (rateLimited) return rateLimited;

        const { email: rawEmail } = await request.json();
        const email = (rawEmail || '').trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
        }

        // SEC-23: Mensagem genérica independente do resultado — não revelar existência de email
        const genericResponse = { message: 'Se este e-mail estiver cadastrado e pendente de verificação, um novo link de ativação será enviado.' };

        // Check user
        const result = await query('SELECT id, name, email_verified FROM users WHERE email = $1', [email]);

        if (!result.rowCount || result.rowCount === 0) {
            return NextResponse.json(genericResponse, { status: 200 });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return NextResponse.json(genericResponse, { status: 200 });
        }

        // Generate new token with 24h expiration (SEC-20)
        const newToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Update database with new token and expiration
        await query(
            'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
            [newToken, tokenExpires, user.id]
        );

        // Send email (falha silenciosa para não revelar info)
        const emailResult = await sendActivationEmail(email, user.name, newToken);
        if (!emailResult.success) {
            console.error('Resend verification email failed for user:', user.id);
        }

        return NextResponse.json(genericResponse, { status: 200 });

    } catch (error: any) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Erro ao reenviar e-mail. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
