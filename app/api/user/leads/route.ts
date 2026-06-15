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

// GET: Fetch all historical leads for properties belonging to this user
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const leadsRes = await query(`
      SELECT 
        l.id,
        l.nome as sender_name,
        l.email as sender_email,
        l.telefone as sender_phone,
        l.mensagem,
        l.status,
        l.created_at,
        p.id as property_id,
        p.nome as property_name
      FROM public.leads l
      JOIN public.produto_servico p ON l.produto_servico_id = p.id
      WHERE p.user_id = $1
      ORDER BY l.created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      leads: leadsRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching user leads:', error);
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }
}

// POST: Register a new lead contact without creating an atendimento card
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, propertyId } = body;

    if (!name || !propertyId) {
      return NextResponse.json({ error: 'Nome do Lead e Imóvel de Interesse são obrigatórios' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

    // Verify property ownership
    const propRes = await query(
      `SELECT id FROM public.produto_servico WHERE id = $1 AND user_id = $2`,
      [Number(propertyId), userId]
    );

    if (propRes.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel inválido ou sem permissão.' }, { status: 403 });
    }

    const insertResult = await query(`
      INSERT INTO public.leads (
        produto_servico_id, user_id, nome, email, telefone, mensagem, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'novo')
      RETURNING *
    `, [
      Number(propertyId),
      null, // Anonymous contact lead
      name,
      email || '',
      cleanPhone,
      'Cadastrado manualmente via Gerenciador de Leads.'
    ]);

    return NextResponse.json({
      success: true,
      message: 'Lead cadastrado com sucesso!',
      lead: insertResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating manual lead:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar lead' }, { status: 500 });
  }
}
