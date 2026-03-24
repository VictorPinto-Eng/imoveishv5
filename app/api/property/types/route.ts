import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let sql = 'SELECT id, descricao FROM imbtpimovel WHERE ativo = true';
    const params = [];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND imbfinalidade_id = $${params.length}`;
    }

    sql += ' ORDER BY descricao ASC';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching property types:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
