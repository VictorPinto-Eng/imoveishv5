import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT 
        e.id, 
        e.descricao,
        e.cep,
        b.descricao AS bairro_nome,
        c.descricao AS cidade_nome,
        est.nome AS estado_nome,
        est.sigla AS estado_sigla
      FROM public.imbempreendimento e
      LEFT JOIN public.apobairro b ON b.id = e.bairro_id
      LEFT JOIN public.apocidade c ON c.id = e.cidade_id
      LEFT JOIN public.apoestado est ON est.id = e.estado_id
      ORDER BY e.descricao
    `);
    return NextResponse.json({ empreendimentos: res.rows });
  } catch (error) {
    console.error('Error fetching empreendimentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar empreendimentos' }, { status: 500 });
  }
}
