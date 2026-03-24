
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
        }

        // Check user
        const result = await query('SELECT id, name, email_verified FROM users WHERE email = $1', [email]);
        
        if (!result.rowCount || result.rowCount === 0) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return NextResponse.json({ error: 'Esta conta já está ativada.' }, { status: 400 });
        }

        // Generate new token
        const newToken = crypto.randomBytes(32).toString('hex');

        // Update database with new token
        await query(
            'UPDATE users SET verification_token = $1 WHERE id = $2',
            [newToken, user.id]
        );

        // Send email
        await sendActivationEmail(email, user.name, newToken);

        return NextResponse.json({ 
            message: 'E-mail de ativação reenviado com sucesso!' 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Erro ao reenviar e-mail. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
