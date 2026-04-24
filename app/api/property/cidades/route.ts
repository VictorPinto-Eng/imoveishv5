import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estadoIdRaw = searchParams.get('estado_id');
  const uf = searchParams.get('uf');

  if (!estadoIdRaw && !uf) {
    return NextResponse.json({ error: 'estado_id or uf is required' }, { status: 400 });
  }

  try {
    let estadoId: number | null = null;

    if (estadoIdRaw) {
      const parsed = Number(estadoIdRaw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        estadoId = parsed;
      }
    }

    if (!estadoId && uf) {
      const stateRes = await query(
        'SELECT id FROM public.apoestado WHERE sigla = $1',
        [uf.toUpperCase()]
      );
      if (stateRes.rows.length > 0) {
        estadoId = Number(stateRes.rows[0].id);
      }
    }

    if (!estadoId) {
      return NextResponse.json([]);
    }

    const citiesRes = await query(
      'SELECT id, descricao as nome FROM public.apocidade WHERE estado_id = $1 ORDER BY descricao',
      [estadoId]
    );

    return NextResponse.json(citiesRes.rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({ error: 'Erro ao buscar cidades' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { descricao, estado_id } = await req.json();
    const cleanDesc = descricao?.toUpperCase().trim();

    if (!cleanDesc || !estado_id) {
      return NextResponse.json({ error: 'Descrição e estado_id são obrigatórios' }, { status: 400 });
    }

    // Check if exists (fuzzy) in that state
    const checkRes = await query(
      `SELECT id FROM public.apocidade WHERE estado_id = $1 AND (TRIM(UPPER(descricao)) = $2 OR translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = $2)`,
      [estado_id, cleanDesc]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cidade já existe', 
        id: checkRes.rows[0].id 
      });
    }

    const insertRes = await query(
      'INSERT INTO public.apocidade (descricao, estado_id) VALUES ($1, $2) RETURNING id',
      [cleanDesc, estado_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Cidade cadastrada com sucesso', 
      id: insertRes.rows[0].id 
    });

  } catch (error: any) {
    console.error('Error creating cidade:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar cidade' }, { status: 500 });
  }
}
