import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: 'A senha é obrigatória para confirmar a exclusão.' }, { status: 400 });
        }

        // Fetch user password hash
        const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const user = userRes.rows[0];

        // Check password
        if (user.password_hash) {
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Senha incorreta.' }, { status: 400 });
            }
        }

        // Desabilitar o acesso do usuário (marcar como ativo = false)
        await query('UPDATE users SET ativo = false WHERE id = $1', [decoded.id]);

        // Desativar todos os cards/imóveis publicados pelo usuário
        await query('UPDATE produtos_servicos SET ativo = false WHERE user_id = $1', [decoded.id]);

        // Create response and clear auth token cookie
        const response = NextResponse.json({ success: true, message: 'Conta excluída com sucesso.' });
        response.cookies.set('token', '', { expires: new Date(0), path: '/' });

        return response;

    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Erro ao excluir a conta.' }, { status: 500 });
    }
}
