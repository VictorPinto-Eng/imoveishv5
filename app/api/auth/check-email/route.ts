
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'E-mail não fornecido' }, { status: 400 });
        }

        const userExists = await query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
        
        if (userExists.rowCount && userExists.rowCount > 0) {
            const user = userExists.rows[0];
            return NextResponse.json({ 
                exists: true, 
                verified: !!user.email_verified 
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error('Check email error:', error);
        return NextResponse.json({ error: 'Erro ao verificar e-mail' }, { status: 500 });
    }
}
