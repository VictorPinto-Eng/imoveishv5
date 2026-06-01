
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const { name, social_name, email, phone, password, confirmPassword, idTipoUsuario, creci_numero, creci_apoestado_id, creci_tipo, cpf_cnpj, data_nascimento } = await request.json();

        const isCorretor = Number(idTipoUsuario) === 2;
        const isProprietario = Number(idTipoUsuario) === 3;
        
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

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insert user (email_verified defaults to FALSE) and get new ID
        const result = await query(
            'INSERT INTO users (name, social_name, email, phone, password_hash, verification_token, id_tipo_usuario, creci_numero, creci_apoestado_id, creci_tipo, cpf_cnpj, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
            [name, social_name || '', email, phone, passwordHash, verificationToken, idTipoUsuario || 1, valCreciNumero, valCreciEstadoId, valCreciTipo, cpf_cnpj || null, data_nascimento || null]
        );
        const newUserId = result.rows[0].id;

        // Automatically assign role 1 (Consumidor)
        await query('INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, 1) ON CONFLICT DO NOTHING', [newUserId]);

        // If they chose another role (2: Corretor, 3: Proprietário), assign it as well
        const selectedRole = Number(idTipoUsuario);
        if (selectedRole === 2 || selectedRole === 3) {
            await query('INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newUserId, selectedRole]);
        }

        // Send email asynchronously and log status
        try {
            await sendActivationEmail(email, name, verificationToken);
            console.log(`Activation email sent successfully to ${email}`);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
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
