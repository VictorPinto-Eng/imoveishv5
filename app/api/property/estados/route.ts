import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(
      'SELECT id, nome, sigla FROM public.apoestado ORDER BY nome'
    );
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching estados:', error);
    return NextResponse.json({ error: 'Erro ao buscar estados' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sigla, nome, pais_id } = await req.json();
    const cleanSigla = sigla?.toUpperCase().trim();
    const cleanNome = nome?.toUpperCase().trim();

    if (!cleanSigla) {
      return NextResponse.json({ error: 'Sigla é obrigatória' }, { status: 400 });
    }

    // Check if exists (fuzzy)
    const checkRes = await query(
      `SELECT id FROM public.apoestado WHERE TRIM(UPPER(sigla)) = $1 OR translate(TRIM(UPPER(sigla)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = $1`,
      [cleanSigla]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Estado já existe', 
        id: checkRes.rows[0].id 
      });
    }

    const insertRes = await query(
      'INSERT INTO public.apoestado (nome, sigla, pais_id) VALUES ($1, $2, $3) RETURNING id',
      [cleanNome || cleanSigla, cleanSigla, pais_id || 1]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Estado cadastrado com sucesso', 
      id: insertRes.rows[0].id 
    });

  } catch (error: any) {
    console.error('Error creating estado:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar estado' }, { status: 500 });
  }
}
