
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'E-mail e senha são obrigatórios.' },
                { status: 400 }
            );
        }

        // Find user
        const res = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rowCount === 0) {
            return NextResponse.json(
                { error: 'E-mail ou senha inválidos.' },
                { status: 401 }
            );
        }

        const user = res.rows[0];

        // Check password
        if (!user.password_hash) {
            return NextResponse.json(
                { error: 'Conta vinculada ao Google. Use o botão Entrar com Google.' },
                { status: 400 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'E-mail ou senha inválidos.' },
                { status: 401 }
            );
        }

        // Check if email is verified
        if (user.email_verified === false) {
            return NextResponse.json(
                { 
                    error: 'Por favor, verifique seu e-mail para ativar sua conta.',
                    needsActivation: true,
                    email: email
                },
                { status: 403 }
            );
        }

        // Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie (optional, but good for SSR)
        const response = NextResponse.json({
            message: 'Login realizado com sucesso!',
            user: { id: user.id, name: user.name, email: user.email }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400, // 1 day
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Erro ao realizar login. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
