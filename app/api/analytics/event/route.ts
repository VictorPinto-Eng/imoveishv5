import { NextRequest, NextResponse } from 'next/server';
import { recordAnalyticsEvent, AnalyticsEventName } from '@/lib/analytics-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // SEC-11: Rate limiting para prevenir poluição de métricas (30 eventos/min por IP)
    const limited = checkRateLimit(req, 'analytics', { maxAttempts: 30, windowMs: 60_000 });
    if (limited) return limited;

    const body = await req.json();
    const {
      produto_servico_id, event_name, session_id, visitor_id,
      event_category, page_url, referrer,
      utm_source, utm_medium, utm_campaign,
      device_type, browser, os, payload
    } = body;

    if (!produto_servico_id || !event_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validar event_name contra lista permitida
    const allowedEvents: string[] = ['page_view', 'property_view', 'property_click', 'contact_click', 'favorite', 'share', 'search', 'lead_submit'];
    if (!allowedEvents.includes(event_name)) {
      return NextResponse.json({ error: 'Invalid event_name' }, { status: 400 });
    }

    // Extract additional info from headers
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    // Simple heuristic for device/browser if not provided by front-end
    const detectedDevice = device_type || (userAgent.includes('Mobi') ? 'mobile' : 'desktop');

    const result = await recordAnalyticsEvent({
      produto_servico_id: Number(produto_servico_id),
      event_name: event_name as AnalyticsEventName,
      session_id,
      visitor_id,
      event_category,
      page_url,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type: detectedDevice,
      browser,
      os,
      ip_address: ip,
      payload
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/analytics/event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
