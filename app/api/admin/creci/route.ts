import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdmin } from '@/lib/verify-admin';
import { sendCreciStatusEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { userId, action } = body;

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
        'UPDATE users SET creci_status = true WHERE id = $1',
        [userId]
      );

      // Envia e-mail de aprovação
      try {
        await sendCreciStatusEmail(user.email, user.name, true);
      } catch (err) {
        console.error('Error sending CRECI approval email:', err);
      }

      return NextResponse.json({ success: true, message: 'CRECI aprovado e ativado com sucesso.' });
    } else if (action === 'reject') {
      // Clear document URL so they must re-upload, and ensure creci_status remains false
      await query(
        'UPDATE users SET creci_document_url = null, creci_status = false WHERE id = $1',
        [userId]
      );

      // Envia e-mail de reprovação
      try {
        await sendCreciStatusEmail(user.email, user.name, false);
      } catch (err) {
        console.error('Error sending CRECI rejection email:', err);
      }

      return NextResponse.json({ success: true, message: 'Documento rejeitado e removido. O corretor precisará reenviar.' });
    } else {
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error handling CRECI status update:', error);
    return NextResponse.json({ error: 'Erro ao processar a validação do CRECI' }, { status: 500 });
  }
}
