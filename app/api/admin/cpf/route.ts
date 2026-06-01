import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';
import { sendCpfStatusEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
    if (!decoded.is_admin) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, razaoSocial } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    // Get user details for the email notification
    const userRes = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const user = userRes.rows[0];

    if (action === 'approve') {
      await query(
        'UPDATE users SET cpf_validated = true, razao_social = $2 WHERE id = $1',
        [userId, razaoSocial?.trim() || null]
      );

      // Envia e-mail de aprovação do CPF
      try {
        await sendCpfStatusEmail(user.email, user.name, true);
      } catch (err) {
        console.error('Error sending CPF approval email:', err);
      }

      return NextResponse.json({ success: true, message: 'CPF homologado e validado com sucesso.' });
    } else if (action === 'reject') {
      // Clear CPF and birth date so they can re-type and request again
      await query(
        'UPDATE users SET cpf_cnpj = null, data_nascimento = null, cpf_validated = false WHERE id = $1',
        [userId]
      );

      // Envia e-mail de reprovação do CPF
      try {
        await sendCpfStatusEmail(user.email, user.name, false);
      } catch (err) {
        console.error('Error sending CPF rejection email:', err);
      }

      return NextResponse.json({ success: true, message: 'CPF rejeitado e removido do perfil. O usuário receberá uma notificação.' });
    } else {
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error handling CPF status update:', error);
    return NextResponse.json({ error: 'Erro ao processar a validação do CPF' }, { status: 500 });
  }
}
