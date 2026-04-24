import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog } from '@/lib/analytics-service';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, action, details, eventCode, origin } = body;

    if (!propertyId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user session if any
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ? 0 : null; // Mapping string UUID to number ID if needed

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
