import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(
      'SELECT id, descricao FROM hv5.imbempreendimento ORDER BY descricao'
    );
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching empreendimentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar empreendimentos' }, { status: 500 });
  }
}
