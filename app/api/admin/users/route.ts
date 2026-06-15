import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

// PUT: Restore a user who requested deletion (sets delete_requested = false, ativo = true)
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
    if (!decoded.is_admin) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    await query(
      'UPDATE users SET ativo = true, delete_requested = false WHERE id = $1',
      [userId]
    );

    // Re-active properties of the user
    await query(
      'UPDATE public.produto_servico SET ativo = true WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({ success: true, message: 'Usuário reativado e solicitação de exclusão cancelada com sucesso.' });

  } catch (error) {
    console.error('Error restoring user:', error);
    return NextResponse.json({ error: 'Erro ao reativar usuário.' }, { status: 500 });
  }
}

// DELETE: Hard-delete a user and all of their related records
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
    if (!decoded.is_admin) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    // 1. Delete user roles
    await query('DELETE FROM public.user_roles WHERE user_id = $1', [userId]);

    // 2. Delete favorites
    await query('DELETE FROM public.user_favorites WHERE user_id = $1', [userId]);

    // 3. Delete leads
    await query('DELETE FROM public.leads WHERE user_id = $1', [userId]);

    // 4. Delete questions
    await query('DELETE FROM public.imovel_perguntas WHERE user_id = $1', [userId]);

    // 5. Delete product media (images)
    await query(`
      DELETE FROM public.produtos_servicos_midia 
      WHERE produto_servico_id IN (SELECT id FROM public.produto_servico WHERE user_id = $1)
    `, [userId]);

    // 6. Delete product characteristics
    await query(`
      DELETE FROM public.produto_servico_carac 
      WHERE produto_servico_id IN (SELECT id FROM public.produto_servico WHERE user_id = $1)
    `, [userId]);

    // 7. Delete sales records
    await query(`
      DELETE FROM public.produto_servicos_venda 
      WHERE produto_servico_id IN (SELECT id FROM public.produto_servico WHERE user_id = $1)
    `, [userId]);

    // 8. Delete rental records
    await query(`
      DELETE FROM public.produto_servicos_loca 
      WHERE produto_servico_id IN (SELECT id FROM public.produto_servico WHERE user_id = $1)
    `, [userId]);

    // 9. Delete properties (produto_servico)
    await query('DELETE FROM public.produto_servico WHERE user_id = $1', [userId]);

    // 10. Delete the user
    await query('DELETE FROM public.users WHERE id = $1', [userId]);

    return NextResponse.json({ success: true, message: 'Usuário e todos os registros associados foram excluídos permanentemente do banco de dados.' });

  } catch (error) {
    console.error('Error hard-deleting user:', error);
    return NextResponse.json({ error: 'Erro ao excluir permanentemente o usuário.' }, { status: 500 });
  }
}
