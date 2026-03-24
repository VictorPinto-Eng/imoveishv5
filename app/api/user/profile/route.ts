import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        const { social_name, email, id_tipo_usuario, phone } = await req.json();

        // Check if email is changing
        const userResult = await query('SELECT email, name FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];
        
        let emailChanged = false;
        let verificationMessage = '';

            if (email && email !== user.email) {
            emailChanged = true;
            const newToken = crypto.randomBytes(32).toString('hex');
            
            await query(
                'UPDATE users SET social_name = $1, email = $2, email_verified = false, verification_token = $3, id_tipo_usuario = $4, phone = $5 WHERE id = $6',
                [social_name || '', email, newToken, id_tipo_usuario || 2, phone || null, decoded.id]
            );

            await sendActivationEmail(email, user.name, newToken);
            verificationMessage = ' Por favor, verifique seu novo e-mail.';
        } else {
            await query(
                'UPDATE users SET social_name = $1, id_tipo_usuario = $2, phone = $3 WHERE id = $4',
                [social_name || '', id_tipo_usuario || 2, phone || null, decoded.id]
            );
        }

        return NextResponse.json({
            success: true,
            message: `Perfil atualizado com sucesso!${verificationMessage}`,
            emailChanged
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }
}
