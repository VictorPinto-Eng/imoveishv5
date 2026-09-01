import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPropertyStats } from '@/lib/analytics-service';
import { JWT_SECRET } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // SEC-33: Exigir autenticação — apenas dono do imóvel ou admin
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let decoded: { id: number; is_admin?: boolean };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const propertyId = Number(id);

    // Verificar ownership ou admin
    if (!decoded.is_admin) {
      const ownerCheck = await query(
        'SELECT user_id FROM produto_servico WHERE produto_servico_id = $1',
        [propertyId]
      );
      if (!ownerCheck.rows.length || ownerCheck.rows[0].user_id !== decoded.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }
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
