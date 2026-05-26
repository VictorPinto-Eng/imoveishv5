import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

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
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (action === 'approve') {
      await query(
        'UPDATE users SET creci_status = true WHERE id = $1',
        [userId]
      );
      return NextResponse.json({ success: true, message: 'CRECI aprovado e ativado com sucesso.' });
    } else if (action === 'reject') {
      // Clear document URL so they must re-upload, and ensure creci_status remains false
      await query(
        'UPDATE users SET creci_document_url = null, creci_status = false WHERE id = $1',
        [userId]
      );
      return NextResponse.json({ success: true, message: 'Documento rejeitado e removido. O corretor precisará reenviar.' });
    } else {
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error handling CRECI status update:', error);
    return NextResponse.json({ error: 'Erro ao processar a validação do CRECI' }, { status: 500 });
  }
}
