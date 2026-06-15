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

// GET: Fetch logs and contact attempts for a specific opportunity/atendimento
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const atendimentoId = searchParams.get('atendimentoId');

  if (!atendimentoId) {
    return NextResponse.json({ error: 'ID do atendimento é obrigatório' }, { status: 400 });
  }

  try {
    // 1. Verify property ownership/permission
    const authCheck = await query(`
      SELECT a.id 
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      WHERE a.id = $1 AND p.user_id = $2
    `, [Number(atendimentoId), userId]);

    if (authCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Atendimento não encontrado ou sem permissão' }, { status: 403 });
    }

    // 2. Fetch logs
    const logsRes = await query(`
      SELECT id, etapa_anterior, etapa_nova, descricao, created_at
      FROM public.atendimento_log
      WHERE atendimento_id = $1
      ORDER BY created_at DESC
    `, [Number(atendimentoId)]);

    const attemptsRes = await query(`
      SELECT att.id, att.meio_contato, att.resultado, att.detalhes, att.created_at, ae.sigla as etapa, ae.nome as etapa_nome
      FROM public.atendimento_tentativa_contato att
      LEFT JOIN public.atendimento_etapa ae ON att.etapa_id = ae.id
      WHERE att.atendimento_id = $1
      ORDER BY att.created_at DESC
    `, [Number(atendimentoId)]);

    return NextResponse.json({
      success: true,
      logs: logsRes.rows,
      attempts: attemptsRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching logs/attempts:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }
}

// POST: Add a new contact attempt and log it
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { atendimentoId, meioContato, resultado, detalhes } = await req.json();

    if (!atendimentoId || !meioContato || !resultado) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // 1. Verify permission
    const authCheck = await query(`
      SELECT a.id, a.etapa_id, ae.sigla as etapa 
      FROM public.atendimento a
      JOIN public.produto_servico p ON a.produto_servico_id = p.id
      LEFT JOIN public.atendimento_etapa ae ON a.etapa_id = ae.id
      WHERE a.id = $1 AND p.user_id = $2
    `, [Number(atendimentoId), userId]);

    if (authCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Atendimento não encontrado ou sem permissão' }, { status: 403 });
    }

    const currentEtapaId = authCheck.rows[0].etapa_id;
    const currentEtapa = authCheck.rows[0].etapa || 'novo';

    // 2. Insert contact attempt
    await query(`
      INSERT INTO public.atendimento_tentativa_contato (
        atendimento_id, user_id, meio_contato, resultado, detalhes, etapa_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [Number(atendimentoId), userId, meioContato, resultado, detalhes || '', currentEtapaId]);

    // 3. Insert general tracking log
    const logDesc = `Tentativa de contato via ${meioContato}. Resultado: ${resultado}${detalhes ? ` (${detalhes})` : ''}.`;
    await query(`
      INSERT INTO public.atendimento_log (
        atendimento_id, user_id, etapa_anterior, etapa_nova, descricao
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [Number(atendimentoId), userId, currentEtapa, currentEtapa, logDesc]);

    return NextResponse.json({
      success: true,
      message: 'Tentativa de contato registrada com sucesso!'
    });
  } catch (error: any) {
    console.error('Error creating contact attempt:', error);
    return NextResponse.json({ error: 'Erro ao registrar tentativa de contato' }, { status: 500 });
  }
}
