
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // SEC-07: Rate limiting — 5 tentativas por 15 minutos
        const rateLimited = checkRateLimit(request, '/api/auth/login', 'auth');
        if (rateLimited) return rateLimited;

        const { email: rawEmail, password } = await request.json();
        const email = (rawEmail || '').trim().toLowerCase();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'E-mail e senha são obrigatórios.' },
                { status: 400 }
            );
        }

        // Find user
        const res = await query(
            'SELECT id, name, email, password_hash, ativo, email_verified FROM users WHERE email = $1',
            [email]
        );
        if (res.rowCount === 0) {
            return NextResponse.json(
                { error: 'E-mail ou senha inválidos.' },
                { status: 401 }
            );
        }

        const user = res.rows[0];

        // SEC-27: Validar senha ANTES de revelar qualquer status da conta
        if (!user.password_hash) {
            return NextResponse.json(
                { error: 'E-mail ou senha inválidos.' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'E-mail ou senha inválidos.' },
                { status: 401 }
            );
        }

        // Só após validar a senha, verificar status da conta
        if (user.ativo === false) {
            return NextResponse.json(
                { error: 'Sua conta está desativada. Entre em contato com o suporte.' },
                { status: 403 }
            );
        }

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

        // Check if user is admin
        const adminRes = await query('SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = $1) as is_admin', [user.id]);
        const isAdmin = adminRes.rows[0]?.is_admin || false;

        // Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, is_admin: isAdmin },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie (optional, but good for SSR)
        const response = NextResponse.json({
            message: 'Login realizado com sucesso!',
            user: { id: user.id, name: user.name, email: user.email, is_admin: isAdmin }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
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
