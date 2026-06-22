import { NextRequest, NextResponse, after } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/resend';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // SEC-07: Rate limiting — 3 tentativas por 10 minutos (envio de email)
        const rateLimited = checkRateLimit(request, '/api/auth/forgot-password', 'email');
        if (rateLimited) return rateLimited;

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
        }

        // 1. Verificar se o usuário existe
        const res = await query('SELECT id, name FROM users WHERE email = $1', [email]);
        
        // Mesmo que o usuário não exista, retornamos sucesso por segurança (evitar enumeração de e-mails)
        if (res.rowCount === 0) {
            return NextResponse.json({ 
                message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' 
            }, { status: 200 });
        }

        const user = res.rows[0];

        // 2. Gerar token de recuperação (32 bytes = 64 chars hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hora a partir de agora

        // 3. Salvar token no banco
        await query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [resetToken, resetExpires, user.id]
        );

        // 4. Disparar e-mail de forma assíncrona
        after(async () => {
            try {
                await sendPasswordResetEmail(email, user.name, resetToken);
                console.log(`Password reset email sent to ${email}`);
            } catch (emailError) {
                console.error('Failed to send reset email:', emailError);
            }
        });

        return NextResponse.json({ 
            message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' 
        }, { status: 200 });
        
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Erro ao processar solicitação. Tente novamente mais tarde.' }, { status: 500 });
    }
}
