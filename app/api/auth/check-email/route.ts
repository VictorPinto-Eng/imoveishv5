
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// SEC-03: Rate limiting simples em memória para prevenir enumeração em massa
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 5; // 5 tentativas por minuto por IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
    try {
        // Rate limiting por IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Muitas tentativas. Aguarde um momento.' },
                { status: 429 }
            );
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'E-mail não fornecido' }, { status: 400 });
        }

        const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);

        if (userExists.rowCount && userExists.rowCount > 0) {
            // SEC-03: Não expor se o email foi verificado ou não — apenas se existe
            return NextResponse.json({ exists: true });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error('Check email error:', error);
        return NextResponse.json({ error: 'Erro ao verificar e-mail' }, { status: 500 });
    }
}
