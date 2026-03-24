import { NextRequest, NextResponse } from 'next/server';
import { getPropertyStats } from '@/lib/analytics-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const propertyId = Number(id);
    // Recalculate health score on-demand
    await getPropertyStats(propertyId); // Ensure net record exists
    const { calculateQualityScore } = await import('@/lib/analytics-service');
    await calculateQualityScore(propertyId);

    const stats = await getPropertyStats(propertyId);

    if (!stats) {
      return NextResponse.json({ 
        error: 'No performance data found for this property',
        summary: {
           total_views: 0, views_today: 0, views_7d: 0, views_30d: 0,
           total_whatsapp: 0, total_phone: 0, total_leads: 0,
           total_shares: 0, total_favorites: 0, total_schedules: 0
        },
        history: [],
        sources: []
      });
    }

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('API Error in /api/analytics/stats/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
