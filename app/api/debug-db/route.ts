import { query } from '../../../lib/db'; // Correct depth: app/api/debug-db (3) -> app (2) -> root (1) -> lib (0)
// wait, app/api/debug-db is 3 levels deep from root.
// app/api/debug-db/route.ts -> (1) app/api/debug-db -> (2) app/api -> (3) app -> (4) root
// So ../../../lib/db is correct.

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
