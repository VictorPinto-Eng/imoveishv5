import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';
import { validatePassword } from '@/lib/validate-password';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 });
        }

        // SEC-09: Validação de força da nova senha
        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
        }

        // Fetch user password hash
        const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const user = userRes.rows[0];

        // SEC-28: Bloquear se conta Google-only (sem senha definida)
        if (!user.password_hash) {
            return NextResponse.json(
                { error: 'Sua conta não possui senha. Use "Esqueci minha senha" para definir uma.' },
                { status: 400 }
            );
        }

        // Check current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // SEC-21: Atualizar senha E registrar timestamp para invalidar tokens antigos
        await query(
            'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
            [newPasswordHash, decoded.id]
        );

        return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso! Faça login novamente.' });

    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Erro ao alterar a senha.' }, { status: 500 });
    }
}
