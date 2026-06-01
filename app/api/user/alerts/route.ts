import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

// Helper to authenticate user
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

// GET: Retrieve all alerts of the user
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(`
      SELECT * FROM public.user_alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return NextResponse.json({ success: true, alerts: res.rows });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
  }
}

// POST: Add search alert
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { name, filters } = await req.json();
    if (!name || !filters) {
      return NextResponse.json({ error: 'Nome e filtros são obrigatórios' }, { status: 400 });
    }

    await query(`
      INSERT INTO public.user_alerts (user_id, nome, filtros)
      VALUES ($1, $2, $3)
    `, [userId, name, JSON.stringify(filters)]);

    return NextResponse.json({ success: true, message: 'Alerta de busca cadastrado com sucesso' });
  } catch (error: any) {
    console.error('Error adding alert:', error);
    return NextResponse.json({ error: 'Erro ao criar alerta de busca' }, { status: 500 });
  }
}

// DELETE: Remove search alert
export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({ error: 'ID do alerta não informado' }, { status: 400 });
    }

    await query(`
      DELETE FROM public.user_alerts
      WHERE user_id = $1 AND id = $2
    `, [userId, Number(alertId)]);

    return NextResponse.json({ success: true, message: 'Alerta excluído com sucesso' });
  } catch (error: any) {
    console.error('Error removing alert:', error);
    return NextResponse.json({ error: 'Erro ao remover alerta' }, { status: 500 });
  }
}
