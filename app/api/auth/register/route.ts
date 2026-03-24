
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendActivationEmail } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const { name, email, phone, password, confirmPassword, idTipoUsuario } = await request.json();

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

        // Insert user (email_verified defaults to FALSE)
        await query(
            'INSERT INTO users (name, email, phone, password_hash, verification_token, id_tipo_usuario) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, email, phone, passwordHash, verificationToken, idTipoUsuario || 2]
        );

        // Send activation email
        await sendActivationEmail(email, name, verificationToken);

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
