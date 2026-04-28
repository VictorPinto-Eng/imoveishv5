import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'produtos_servicos'
            ORDER BY ordinal_position
        `);
        return NextResponse.json({ 
            columns: res.rows,
            host: process.env.DATABASE_URL ? 'Connected' : 'Missing Env'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
