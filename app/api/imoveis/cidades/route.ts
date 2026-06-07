import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT DISTINCT CID.descricao as cidade
      FROM public.produto_servico p
      JOIN public.apocidade CID ON p.cidade_id = CID.id
      WHERE p.tipo = 'produto' 
        AND p.categoria = 'Imovel' 
        AND p.status = 'ativo' 
        AND p.ativo = true
      ORDER BY cidade ASC
    `);

    const cities = res.rows.map((row: any) => row.cidade);
    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching registered cities:', error);
    return NextResponse.json({ error: 'Erro ao buscar cidades cadastradas' }, { status: 500 });
  }
}
