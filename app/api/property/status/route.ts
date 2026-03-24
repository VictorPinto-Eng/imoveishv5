import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT id, nome FROM statimovel WHERE ativo = true ORDER BY nome ASC');
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching property statuses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
