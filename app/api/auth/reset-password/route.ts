import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token e nova senha são obrigatórios.' }, { status: 400 });
        }

        // 1. Verificar se o token é válido e não expirou
        const res = await query(
            'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );

        if (res.rowCount === 0) {
            return NextResponse.json({ 
                error: 'O link de recuperação é inválido ou já expirou.' 
            }, { status: 400 });
        }

        const userId = res.rows[0].id;

        // 2. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Atualizar a senha e limpar os campos de recuperação
        await query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );

        return NextResponse.json({ 
            message: 'Senha redefinida com sucesso! Agora você já pode fazer o login.' 
        }, { status: 200 });
        
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Erro ao redefinir senha. Tente novamente mais tarde.' }, { status: 500 });
    }
}
