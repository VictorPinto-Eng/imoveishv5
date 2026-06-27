
import { NextRequest, NextResponse, after } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';
import { validatePassword } from '@/lib/validate-password';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // SEC-07: Rate limiting — 5 tentativas por 15 minutos
        const rateLimited = checkRateLimit(request, '/api/auth/register', 'auth');
        if (rateLimited) return rateLimited;
        const { name, social_name, email: rawEmail, phone, password, confirmPassword, idTipoUsuario, roles, creci_numero, creci_apoestado_id, creci_tipo, cpf_cnpj, data_nascimento } = await request.json();
        const email = (rawEmail || '').trim().toLowerCase();

        // Convert roles to array of numbers
        // In the database: 1 = Consumidor, 2 = Proprietário, 3 = Corretor
        // If the old idTipoUsuario was passed, map it to the correct new ID:
        // old idTipoUsuario: 1 -> 1 (Consumidor), 2 -> 3 (Corretor), 3 -> 2 (Proprietário)
        let rolesToSave: number[] = [];
        if (Array.isArray(roles)) {
            rolesToSave = roles.map(Number);
        } else if (idTipoUsuario) {
            const mappedId = Number(idTipoUsuario) === 2 ? 3 : Number(idTipoUsuario) === 3 ? 2 : 1;
            rolesToSave = [mappedId];
        } else {
            rolesToSave = [1];
        }

        const isCorretor = rolesToSave.includes(3);
        const isProprietario = rolesToSave.includes(2);
        
        const valCreciNumero = isCorretor ? (creci_numero || null) : null;
        const valCreciEstadoId = isCorretor ? (Number(creci_apoestado_id) || null) : null;
        const valCreciTipo = isCorretor ? (creci_tipo || null) : null;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: nome, e-mail e senha.' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'As senhas não coincidem.' },
                { status: 400 }
            );
        }

        // SEC-09: Validação de força da senha
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
        }

        // Validate fields for Proprietário
        if (isProprietario) {
            if (!cpf_cnpj) {
                return NextResponse.json({ error: 'O CPF/CNPJ é obrigatório para proprietários.' }, { status: 400 });
            }
            if (!data_nascimento) {
                return NextResponse.json({ error: 'A data de nascimento é obrigatória para proprietários.' }, { status: 400 });
            }
        }

        // Validate fields for Corretor
        if (isCorretor) {
            if (!cpf_cnpj) {
                return NextResponse.json({ error: 'O CPF é obrigatório para corretores.' }, { status: 400 });
            }
            if (!data_nascimento) {
                return NextResponse.json({ error: 'A data de nascimento é obrigatória para corretores.' }, { status: 400 });
            }
            if (!valCreciNumero || !valCreciEstadoId || !valCreciTipo) {
                return NextResponse.json({ error: 'Os dados do CRECI são obrigatórios para corretores.' }, { status: 400 });
            }
        }

        // Check if user already exists
        const userExists = await query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
        if (userExists.rowCount && userExists.rowCount > 0) {
            const user = userExists.rows[0];
            if (!user.email_verified) {
                return NextResponse.json(
                    { 
                        error: 'Este e-mail já está cadastrado, mas ainda não foi ativado.',
                        needsActivation: true,
                        email: email
                    },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Este e-mail já está cadastrado.' },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate verification token with 24h expiration (SEC-20)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Insert user (email_verified defaults to FALSE) and get new ID
        const result = await query(
            'INSERT INTO users (name, social_name, email, phone, password_hash, verification_token, verification_token_expires, creci_numero, creci_apoestado_id, creci_tipo, cpf_cnpj, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
            [name, social_name || '', email, phone, passwordHash, verificationToken, verificationExpires, valCreciNumero, valCreciEstadoId, valCreciTipo, cpf_cnpj || null, data_nascimento || null]
        );
        const newUserId = result.rows[0].id;

        // Insert all selected roles into public.user_roles
        for (const roleId of rolesToSave) {
            await query('INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newUserId, roleId]);
        }

        // Send email and check status
        const emailResult = await sendActivationEmail(email, name, verificationToken);
        if (!emailResult.success) {
            console.error('❌ Email sending failed:', emailResult.error);
            const errMsg = (emailResult.error as any)?.message || 'Erro de envio.';
            return NextResponse.json(
                { error: `Erro ao enviar e-mail de ativação: ${errMsg}. Verifique se o e-mail digitado é válido.` },
                { status: 400 }
            );
        }
        // SEC-29: Log sem expor email em produção
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Activation email sent to user id: ${newUserId}`);
        }

        return NextResponse.json({ 
            message: 'Conta criada com sucesso! Verifique seu e-mail para ativar sua conta.' 
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Erro ao criar conta. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
