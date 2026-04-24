import { query } from './db';

export type AnalyticsEventName = 
  | 'view_property' 
  | 'click_whatsapp' 
  | 'click_phone' 
  | 'lead_submit' 
  | 'share_property' 
  | 'favorite_property' 
  | 'schedule_visit'
  | 'search_impression';

export interface AnalyticsEventData {
  produto_servico_id: number;
  session_id?: string;
  visitor_id?: string;
  event_name: AnalyticsEventName;
  event_category?: string;
  page_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  user_id?: number;
  organization_id?: number;
  payload?: any;
}

/**
 * Ensures a companion record exists in produto_servico_net and returns its ID.
 */
async function getOrCreateNetId(produtoServicoId: number): Promise<number | null> {
  try {
    const res = await query(
      'SELECT id FROM produto_servico_net WHERE produto_servico_id = $1',
      [produtoServicoId]
    );

    if (res.rows.length > 0) {
      return res.rows[0].id;
    }

    const insertRes = await query(
      'INSERT INTO produto_servico_net (produto_servico_id, published_at) VALUES ($1, NOW()) RETURNING id',
      [produtoServicoId]
    );

    return insertRes.rows[0].id;
  } catch (error) {
    console.error('[Analytics] Error in getOrCreateNetId:', error);
    return null;
  }
}

/**
 * Calculates a quality score (0-100) based on property data.
 */
export async function calculateQualityScore(produtoServicoId: number): Promise<number> {
  try {
    const res = await query(`
      SELECT imagens_urls, descricao, logradouro, numero, cep, status
      FROM produtos_servicos WHERE id = $1
    `, [produtoServicoId]);

    if (res.rows.length === 0) return 0;
    const p = res.rows[0];
    let score = 0;

    // 1. Photos (Max 40)
    const photoCount = Array.isArray(p.imagens_urls) ? p.imagens_urls.length : 0;
    if (photoCount >= 15) score += 40;
    else if (photoCount >= 5) score += 20;
    else if (photoCount >= 1) score += 10;

    // 2. Description (Max 20)
    const descLength = (p.descricao || '').length;
    if (descLength > 500) score += 20;
    else if (descLength > 100) score += 10;

    // 3. Address completeness (Max 20)
    if (p.cep) score += 10;
    if (p.logradouro && p.numero) score += 10;

    // 4. Status & Basic Meta (Max 20)
    if (p.status === 'ativo') score += 20;

    // Update the net table
    await query('UPDATE produto_servico_net SET quality_score = $1, updated_at = NOW() WHERE produto_servico_id = $2', [score, produtoServicoId]);

    return score;
  } catch (error) {
    console.error('[Analytics] Error calculating quality score:', error);
    return 0;
  }
}

/**
 * Records a raw event and increments the daily metrics.
 */
export async function recordAnalyticsEvent(data: AnalyticsEventData) {
  const netId = await getOrCreateNetId(data.produto_servico_id);
  if (!netId) return { success: false, error: 'Failed to resolve net ID' };

  try {
    // 1. Record raw event
    await query(`
      INSERT INTO analytics_events (
        produto_servico_net_id, session_id, visitor_id, event_name, event_category,
        page_url, referrer, utm_source, utm_medium, utm_campaign,
        device_type, browser, os, ip_address, user_id, organization_id, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      netId, data.session_id, data.visitor_id, data.event_name, data.event_category,
      data.page_url, data.referrer, data.utm_source, data.utm_medium, data.utm_campaign,
      data.device_type, data.browser, data.os, data.ip_address, data.user_id, 
      data.organization_id, JSON.stringify(data.payload || {})
    ]);

    // 2. Increment daily metrics
    const metricColumnMap: Record<string, string> = {
      'view_property': 'visualizacoes',
      'click_whatsapp': 'cliques_whatsapp',
      'click_phone': 'cliques_telefone',
      'lead_submit': 'leads',
      'share_property': 'compartilhamentos',
      'favorite_property': 'favoritos',
      'schedule_visit': 'agendamentos',
      'search_impression': 'search_impressions'
    };

    const col = metricColumnMap[data.event_name];
    if (col) {
      await query(`
        INSERT INTO analytics_daily_metrics (produto_servico_net_id, data_referencia, ${col}, organization_id, updated_at)
        VALUES ($1, CURRENT_DATE, 1, $2, NOW())
        ON CONFLICT (produto_servico_net_id, data_referencia)
        DO UPDATE SET 
          ${col} = analytics_daily_metrics.${col} + 1,
          updated_at = NOW()
      `, [netId, data.organization_id || null]);
    }

    return { success: true };
  } catch (error) {
    console.error('[Analytics] Error recording event:', error);
    return { success: false, error };
  }
}

/**
 * Records impressions for multiple properties at once.
 */
export async function recordSearchImpressions(produtoServicoIds: number[], organizationId?: number) {
  try {
    for (const id of produtoServicoIds) {
      const netId = await getOrCreateNetId(id);
      if (netId) {
        await query(`
          INSERT INTO analytics_daily_metrics (produto_servico_net_id, data_referencia, search_impressions, organization_id, updated_at)
          VALUES ($1, CURRENT_DATE, 1, $2, NOW())
          ON CONFLICT (produto_servico_net_id, data_referencia)
          DO UPDATE SET 
            search_impressions = analytics_daily_metrics.search_impressions + 1,
            updated_at = NOW()
        `, [netId, organizationId || null]);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[Analytics] Error recording batch impressions:', error);
    return { success: false, error };
  }
}

/**
 * Fetches consolidated stats for a property.
 */
export async function getPropertyStats(produtoServicoId: number) {
  try {
    // Recalculate quality score on demand if needed, or just fetch let the UI trigger it
    // For now, let's just fetch everything
    const netRes = await query(
      'SELECT id, quality_score, market_price_avg, published_at, is_featured, is_boosted FROM produto_servico_net WHERE produto_servico_id = $1',
      [produtoServicoId]
    );

    let netData = netRes.rows[0];

    if (netRes.rows.length === 0) {
      // Return zeroed stats for new properties
      return {
        net: { quality_score: 0, published_at: new Date(), is_featured: false, is_boosted: false },
        summary: {
          total_views: 0, views_today: 0, views_7d: 0, views_30d: 0,
          total_whatsapp: 0, total_phone: 0, total_leads: 0,
          total_shares: 0, total_favorites: 0, total_schedules: 0,
          total_impressions: 0, ctr: 0
        },
        history: [],
        sources: []
      };
    }
    const netId = netData.id;

    // 1. Summary metrics
    const summary = await query(`
      SELECT 
        COALESCE(SUM(visualizacoes), 0) as total_views,
        COALESCE(SUM(CASE WHEN data_referencia = CURRENT_DATE THEN visualizacoes ELSE 0 END), 0) as views_today,
        COALESCE(SUM(CASE WHEN data_referencia >= CURRENT_DATE - INTERVAL '7 days' THEN visualizacoes ELSE 0 END), 0) as views_7d,
        COALESCE(SUM(CASE WHEN data_referencia >= CURRENT_DATE - INTERVAL '30 days' THEN visualizacoes ELSE 0 END), 0) as views_30d,
        COALESCE(SUM(cliques_whatsapp), 0) as total_whatsapp,
        COALESCE(SUM(cliques_telefone), 0) as total_phone,
        COALESCE(SUM(leads), 0) as total_leads,
        COALESCE(SUM(compartilhamentos), 0) as total_shares,
        COALESCE(SUM(favoritos), 0) as total_favorites,
        COALESCE(SUM(agendamentos), 0) as total_schedules,
        COALESCE(SUM(search_impressions), 0) as total_impressions
      FROM analytics_daily_metrics
      WHERE produto_servico_net_id = $1
    `, [netId]);

    const s = summary.rows[0];
    const totalViews = Number(s.total_views);
    const totalImpressions = Number(s.total_impressions);
    const ctr = totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0;

    // 2. Daily history
    const history = await query(`
      SELECT data_referencia as date, visualizacoes, cliques_whatsapp, leads, search_impressions
      FROM analytics_daily_metrics
      WHERE produto_servico_net_id = $1
        AND data_referencia >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY data_referencia ASC
    `, [netId]);

    // 3. Traffic sources
    const sources = await query(`
      SELECT utm_source, COUNT(*) as count
      FROM analytics_events
      WHERE produto_servico_net_id = $1
        AND event_name = 'view_property'
        AND utm_source IS NOT NULL
      GROUP BY utm_source
      ORDER BY count DESC
      LIMIT 10
    `, [netId]);

    return {
      net: netData,
      summary: { ...s, ctr: ctr.toFixed(2) },
      history: history.rows,
      sources: sources.rows
    };
  } catch (error) {
    console.error('[Analytics] Error fetching stats:', error);
    throw error;
  }
}
/**
 * Records an internal system audit log.
 */
export async function recordAuditLog(
  propertyId: number,
  userId: number | null,
  action: string,
  details: any = {},
  ipAddress?: string,
  codigoEvento?: string,
  origem?: string
) {
  try {
    await query(`
      INSERT INTO produtos_servicos_log (
        produto_servico_id, user_id, acao, detalhes, ip_address, codigo_evento, origem
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      propertyId, 
      userId, 
      action, 
      JSON.stringify(details), 
      ipAddress || null,
      codigoEvento || null,
      origem || null
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('[Analytics] Error recording audit log:', error);
    return { success: false, error };
  }
}
