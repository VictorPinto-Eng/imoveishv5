import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// GET: Fetch message history for a given atendimento
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const atendimentoId = searchParams.get('atendimentoId');

  if (!atendimentoId) {
    return NextResponse.json({ error: 'ID de atendimento é obrigatório.' }, { status: 400 });
  }

  try {
    // 1. Verify access: User must be either the client (atendimento.user_id = userId)
    // or the advertiser (property owner, produto_servico.user_id = userId)
    const accessCheck = await query(`
      SELECT 
        a.id as atendimento_id,
        a.user_id as client_id,
        a.email as client_email,
        p.user_id as owner_id
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      WHERE a.id = $1
    `, [Number(atendimentoId)]);

    if (accessCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Atendimento não encontrado.' }, { status: 404 });
    }

    const { client_id, owner_id, client_email } = accessCheck.rows[0];
    const isOwner = owner_id === userId;
    const isClient = client_id === userId;

    if (!isOwner && !isClient) {
      // Secondary check: match client email to user email just in case user_id wasn't set yet
      const userEmailCheck = await query(`SELECT email FROM public.users WHERE id = $1`, [userId]);
      const userEmail = userEmailCheck.rows[0]?.email;
      if (!userEmail || userEmail.toLowerCase() !== client_email?.toLowerCase()) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    // 2. Mark messages as read:
    // If the requester is the client, mark broker (corretor) messages as read.
    // If the requester is the broker (corretor), mark client messages as read.
    const role = searchParams.get('role');
    const readerType = role === 'cliente' ? 'corretor' : role === 'corretor' ? 'cliente' : (isOwner ? 'cliente' : 'corretor');
    await query(`
      UPDATE public.atendimento_mensagens
      SET lida = TRUE
      WHERE atendimento_id = $1 AND sender_type = $2 AND lida = FALSE
    `, [Number(atendimentoId), readerType]);

    // 3. Fetch all messages
    const messagesRes = await query(`
      SELECT id, sender_type, mensagem, lida, created_at
      FROM public.atendimento_mensagens
      WHERE atendimento_id = $1
      ORDER BY created_at ASC
    `, [Number(atendimentoId)]);

    return NextResponse.json({
      success: true,
      messages: messagesRes.rows
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Send a message in an atendimento
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { atendimentoId, message, senderType } = await req.json();

    if (!atendimentoId || !message || !senderType) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    if (senderType !== 'corretor' && senderType !== 'cliente') {
      return NextResponse.json({ error: 'Remetente inválido.' }, { status: 400 });
    }

    // Verify access
    const accessCheck = await query(`
      SELECT 
        a.id as atendimento_id,
        a.user_id as client_id,
        a.email as client_email,
        p.user_id as owner_id
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      WHERE a.id = $1
    `, [Number(atendimentoId)]);

    if (accessCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Atendimento não encontrado.' }, { status: 404 });
    }

    const { client_id, owner_id, client_email } = accessCheck.rows[0];
    const isOwner = owner_id === userId;
    const isClient = client_id === userId;

    if (!isOwner && !isClient) {
      const userEmailCheck = await query(`SELECT email FROM public.users WHERE id = $1`, [userId]);
      const userEmail = userEmailCheck.rows[0]?.email;
      if (!userEmail || userEmail.toLowerCase() !== client_email?.toLowerCase()) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    // Verify that senderType matches the user's role in this context
    if (senderType === 'corretor' && !isOwner) {
      return NextResponse.json({ error: 'Acesso negado como corretor.' }, { status: 403 });
    }
    if (senderType === 'cliente' && isOwner && !isClient) {
      // An owner cannot send messages as a client unless they are both (unlikely)
      return NextResponse.json({ error: 'Acesso negado como cliente.' }, { status: 403 });
    }

    // Insert message
    const insertRes = await query(`
      INSERT INTO public.atendimento_mensagens (atendimento_id, sender_type, mensagem, lida)
      VALUES ($1, $2, $3, FALSE)
      RETURNING id, sender_type, mensagem, lida, created_at
    `, [Number(atendimentoId), senderType, message]);

    return NextResponse.json({
      success: true,
      message: insertRes.rows[0]
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
