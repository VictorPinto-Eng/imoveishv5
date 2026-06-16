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
        const { social_name, email: rawEmail, id_tipo_usuario, roles, phone, creci_numero, creci_apoestado_id, creci_tipo, cpf_cnpj, data_nascimento, razao_social } = await req.json();
        const email = (rawEmail || '').trim().toLowerCase();

        // Check if email is changing
        const userResult = await query('SELECT email, name, creci_document_url FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];
        
        let emailChanged = false;
        let verificationMessage = '';

        if (!email) {
            return NextResponse.json({ error: 'O e-mail é obrigatório' }, { status: 400 });
        }

        const rolesToSave: number[] = Array.isArray(roles) ? roles.map(Number) : [Number(id_tipo_usuario || 1)];
        const isProprietario = rolesToSave.includes(2);
        const isCorretor = rolesToSave.includes(3);
        const mainRoleId = Math.max(...rolesToSave);
        
        const valCreciNumero = isCorretor ? (creci_numero || null) : null;
        const valCreciEstadoId = isCorretor ? (Number(creci_apoestado_id) || null) : null;
        const valCreciTipo = isCorretor ? (creci_tipo || null) : null;

        if (isProprietario) {
            if (!cpf_cnpj) {
                return NextResponse.json({ error: 'O CPF/CNPJ é obrigatório para proprietários.' }, { status: 400 });
            }
            if (!data_nascimento) {
                return NextResponse.json({ error: 'A data de nascimento é obrigatória para proprietários.' }, { status: 400 });
            }
        }

        if (isCorretor) {
            if (!cpf_cnpj) {
                return NextResponse.json({ error: 'O CPF é obrigatório para corretores.' }, { status: 400 });
            }
            if (!data_nascimento) {
                return NextResponse.json({ error: 'A data de nascimento é obrigatória para corretores.' }, { status: 400 });
            }
            if (!valCreciNumero || !valCreciEstadoId || !valCreciTipo) {
                return NextResponse.json({ error: 'Todos os campos de CRECI (número, UF e tipo) são obrigatórios para corretores/imobiliárias.' }, { status: 400 });
            }
            if (!user.creci_document_url) {
                return NextResponse.json({ error: 'O upload do comprovante do CRECI é obrigatório para corretores/imobiliárias.' }, { status: 400 });
            }
        }

        if (email !== user.email) {
            // Validar se o novo e-mail já está cadastrado/em uso por outro usuário
            const emailExists = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, decoded.id]);
            if (emailExists.rowCount && emailExists.rowCount > 0) {
                return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outra conta.' }, { status: 400 });
            }

            emailChanged = true;
            const newToken = crypto.randomBytes(32).toString('hex');
            
            // Update database first
            await query(
                `UPDATE users 
                 SET social_name = $1, email = $2, email_verified = false, verification_token = $3, 
                     phone = $4, creci_numero = $5, creci_apoestado_id = $6, creci_tipo = $7,
                     cpf_cnpj = $8, data_nascimento = $9, razao_social = $10
                 WHERE id = $11`,
                [social_name || '', email, newToken, phone || null, valCreciNumero, valCreciEstadoId, valCreciTipo, cpf_cnpj || null, data_nascimento || null, razao_social || null, decoded.id]
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
                 SET social_name = $1, phone = $2, creci_numero = $3, creci_apoestado_id = $4, creci_tipo = $5,
                     cpf_cnpj = $6, data_nascimento = $7, razao_social = $8
                 WHERE id = $9`,
                [social_name || '', phone || null, valCreciNumero, valCreciEstadoId, valCreciTipo, cpf_cnpj || null, data_nascimento || null, razao_social || null, decoded.id]
            );
        }

        // Sync user_roles
        await query('DELETE FROM public.user_roles WHERE user_id = $1', [decoded.id]);
        for (const roleId of rolesToSave) {
            await query(
                `INSERT INTO public.user_roles (user_id, role_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT DO NOTHING`,
                [decoded.id, roleId]
            );
        }

        const response = NextResponse.json({
            success: true,
            message: `Perfil atualizado com sucesso!${verificationMessage}`,
            emailChanged
        });

        if (emailChanged) {
            response.cookies.set('token', '', { expires: new Date(0), path: '/' });
        }

        return response;

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }
}
