import { NextRequest, NextResponse, after } from 'next/server';
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
        const { social_name, email, id_tipo_usuario, phone, creci_numero, creci_apoestado_id, creci_tipo } = await req.json();

        // Check if email is changing
        const userResult = await query('SELECT email, name, creci_document_url FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];
        
        let emailChanged = false;
        let verificationMessage = '';

        if (!email) {
            return NextResponse.json({ error: 'O e-mail é obrigatório' }, { status: 400 });
        }

        const isCorretor = Number(id_tipo_usuario) === 1;
        const valCreciNumero = isCorretor ? (creci_numero || null) : null;
        const valCreciEstadoId = isCorretor ? (Number(creci_apoestado_id) || null) : null;
        const valCreciTipo = isCorretor ? (creci_tipo || null) : null;

        if (isCorretor) {
            if (!valCreciNumero || !valCreciEstadoId || !valCreciTipo) {
                return NextResponse.json({ error: 'Todos os campos de CRECI (número, UF e tipo) são obrigatórios para corretores/imobiliárias.' }, { status: 400 });
            }
            if (!user.creci_document_url) {
                return NextResponse.json({ error: 'O upload do comprovante do CRECI é obrigatório para corretores/imobiliárias.' }, { status: 400 });
            }
        }

        if (email !== user.email) {
            emailChanged = true;
            const newToken = crypto.randomBytes(32).toString('hex');
            
            // Update database first
            await query(
                `UPDATE users 
                 SET social_name = $1, email = $2, email_verified = false, verification_token = $3, 
                     id_tipo_usuario = $4, phone = $5, creci_numero = $6, creci_apoestado_id = $7, creci_tipo = $8 
                 WHERE id = $9`,
                [social_name || '', email, newToken, id_tipo_usuario || 2, phone || null, valCreciNumero, valCreciEstadoId, valCreciTipo, decoded.id]
            );

            // OPTIMIZATION: Send email in background AFTER response
            after(async () => {
                try {
                    await sendActivationEmail(email, user.name, newToken);
                } catch (emailErr) {
                    console.error('Background profile email failed:', emailErr);
                }
            });
            
            verificationMessage = ' Por favor, verifique seu novo e-mail para ativá-lo.';
        } else {
            await query(
                `UPDATE users 
                 SET social_name = $1, id_tipo_usuario = $2, phone = $3, creci_numero = $4, creci_apoestado_id = $5, creci_tipo = $6 
                 WHERE id = $7`,
                [social_name || '', id_tipo_usuario || 2, phone || null, valCreciNumero, valCreciEstadoId, valCreciTipo, decoded.id]
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
