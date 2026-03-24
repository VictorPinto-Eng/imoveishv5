import { NextRequest, NextResponse } from 'next/server';
import { recordSearchImpressions } from '@/lib/analytics-service';

export async function POST(req: NextRequest) {
  try {
    const { ids, organization_id } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Array of IDs is required' }, { status: 400 });
    }

    const result = await recordSearchImpressions(ids, organization_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error in /api/analytics/impressions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
