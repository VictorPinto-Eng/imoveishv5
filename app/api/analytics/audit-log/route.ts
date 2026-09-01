import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { recordAuditLog } from '@/lib/analytics-service';
import { JWT_SECRET } from '@/lib/auth-config';
import { checkRateLimit } from '@/lib/rate-limit';

// SEC-34: Actions públicas de tracking (visitantes anônimos) — controladas por rate limit
const PUBLIC_ACTIONS = ['view', 'click_whatsapp', 'click_phone', 'share', 'favorite', 'share_modal_opened'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, action, details, eventCode, origin } = body;

    if (!propertyId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SEC-34: Actions públicas permitem acesso anônimo com rate limiting
    // Actions sensíveis (admin, delete, etc.) exigem autenticação
    const isPublicAction = PUBLIC_ACTIONS.includes(action);
    let userId: number | null = null;

    const token = req.cookies.get('token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch {
        // Token inválido — tratar como anônimo para actions públicas
        if (!isPublicAction) {
          return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }
      }
    } else if (!isPublicAction) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Rate limit para requests anônimos (previne log poisoning)
    if (!userId) {
      const limited = checkRateLimit(req, 'audit-log', 'general');
      if (limited) return limited;
    }

    // Extract IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    const result = await recordAuditLog(
      Number(propertyId),
      userId,
      action,
      details || {},
      ip,
      eventCode,
      origin
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/analytics/audit-log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
