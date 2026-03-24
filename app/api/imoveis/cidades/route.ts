import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT DISTINCT (custom_fields->>'cidade') as cidade
      FROM produtos_servicos
      WHERE tipo = 'produto' 
        AND categoria = 'Imovel' 
        AND status = 'ativo' 
        AND ativo = true
        AND (custom_fields->>'cidade') IS NOT NULL
      ORDER BY cidade ASC
    `);

    const cities = res.rows.map((row: any) => row.cidade);
    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching registered cities:', error);
    return NextResponse.json({ error: 'Erro ao buscar cidades cadastradas' }, { status: 500 });
  }
}
