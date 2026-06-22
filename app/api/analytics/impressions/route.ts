import { NextRequest, NextResponse } from 'next/server';
import { recordSearchImpressions } from '@/lib/analytics-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 20 requests/min por IP
    const limited = checkRateLimit(req, 'impressions', { maxAttempts: 20, windowMs: 60_000 });
    if (limited) return limited;

    const { ids, organization_id } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Array of IDs is required' }, { status: 400 });
    }

    // Limitar tamanho do array para evitar abuso
    if (ids.length > 100) {
      return NextResponse.json({ error: 'Máximo 100 IDs por request' }, { status: 400 });
    }

    const result = await recordSearchImpressions(ids, organization_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error in /api/analytics/impressions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
