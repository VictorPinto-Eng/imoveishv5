'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Users, MessageCircle, MousePointer2, 
  BarChart3, Globe, AlertCircle, Loader2,
  CheckCircle2, Info, Search, Calendar
} from 'lucide-react';
import styles from './propertyPerformance.module.css';

interface PerformanceData {
  net: {
    quality_score: number;
    published_at: string;
    is_featured: boolean;
    is_boosted: boolean;
  };
  summary: {
    total_views: number;
    views_today: number;
    views_7d: number;
    views_30d: number;
    total_whatsapp: number;
    total_phone: number;
    total_leads: number;
    total_shares: number;
    total_favorites: number;
    total_schedules: number;
    total_impressions: number;
    ctr: string;
  };
  history: Array<{
    date: string;
    visualizacoes: number;
    cliques_whatsapp: number;
    leads: number;
    search_impressions: number;
  }>;
  sources: Array<{
    utm_source: string;
    count: number;
  }>;
}

interface PropertyPerformanceProps {
  propertyId: number;
}

export default function PropertyPerformance({ propertyId }: PropertyPerformanceProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/stats/${propertyId}`);
        if (!res.ok) throw new Error('Falha ao carregar estatísticas');
        const stats = await res.json();
        setData(stats);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchStats();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin text-red-600" size={32} />
        <p>Carregando desempenho profissional...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3>Ops!</h3>
        <p>{error || 'Não foi possível encontrar dados de desempenho.'}</p>
      </div>
    );
  }

  const { net, summary, history, sources } = data;

  const daysOnMarket = Math.floor((new Date().getTime() - new Date(net.published_at).getTime()) / (1000 * 60 * 60 * 24));
  
  const getQualityColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className={styles.container}>
      {/* Mercado Standard Section */}
      <div className={styles.marketHeader}>
        <div className={styles.qualityScore}>
          <div className={styles.scoreCircle} style={{ borderColor: getQualityColor(net.quality_score) }}>
            <span className={styles.scoreValue}>{net.quality_score}</span>
            <span className={styles.scoreLabel}>Score</span>
          </div>
          <div className={styles.qualityText}>
            <h4>Saúde do Anúncio</h4>
            <p>{net.quality_score >= 80 ? 'Excelente! Seu anúncio está completo.' : 'Pode melhorar. Adicione mais fotos ou descrição.'}</p>
          </div>
        </div>

        <div className={styles.quickStats}>
          <div className={styles.quickStatItem}>
            <Calendar size={16} />
            <span>{daysOnMarket} dias no ar</span>
          </div>
          <div className={styles.quickStatItem}>
            <Search size={16} />
            <span>CTR: <strong>{summary.ctr}%</strong></span>
            <span title="Taxa de cliques em relação às exibições na busca">
              <Info size={14} className={styles.infoIcon} />
            </span>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Search className={styles.iconImpressions} size={20} />
            <span>Exibições na Busca</span>
          </div>
          <div className={styles.mainValue}>{summary.total_impressions}</div>
          <div className={styles.subValues}>
             <span className={styles.subHint}>Visibilidade do imóvel nos resultados</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <BarChart3 className={styles.iconViews} size={20} />
            <span>Cliques / Visualizações</span>
          </div>
          <div className={styles.mainValue}>{summary.total_views}</div>
          <div className={styles.subValues}>
            <div className={styles.subItem}>
              <span>Hoje</span>
              <strong>{summary.views_today}</strong>
            </div>
            <div className={styles.subItem}>
              <span>30 dias</span>
              <strong>{summary.views_30d}</strong>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Users className={styles.iconLeads} size={20} />
            <span>Leads Recebidos</span>
          </div>
          <div className={styles.mainValue}>{summary.total_leads}</div>
          <div className={styles.subValues}>
            <div className={styles.subItem}>
              <span>Conversão total</span>
              <strong>{((summary.total_leads / (summary.total_views || 1)) * 100).toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Trends Chart */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
             <TrendingUp size={18} /> Tendência de Performance (30 dias)
          </h3>
          <div className={styles.chartLegend}>
             <span className={styles.legendItem}><i style={{ background: '#c4b5fd' }}></i> Visualizações</span>
             <span className={styles.legendItem}><i style={{ background: '#e2e8f0' }}></i> Exibições</span>
          </div>
        </div>
        
        <div className={styles.chartWrapper}>
          {history.length > 0 ? (
            <div className={styles.barContainer}>
              {history.map((day, idx) => {
                const maxVal = Math.max(...history.map(d => Math.max(d.visualizacoes, d.search_impressions / 10)), 1);
                const viewHeight = (day.visualizacoes / maxVal) * 100;
                const impHeight = (day.search_impressions / 10 / maxVal) * 100; // Scaled for comparison
                
                return (
                  <div key={idx} className={styles.barGroup} title={`${new Date(day.date).toLocaleDateString()}: ${day.visualizacoes} views, ${day.search_impressions} imps`}>
                    <div className={styles.multiBar}>
                      <div className={styles.barImp} style={{ height: `${Math.max(impHeight, 2)}%` }} />
                      <div className={styles.barView} style={{ height: `${Math.max(viewHeight, 5)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyText}>Sem histórico de tendências ainda.</p>
          )}
        </div>
      </div>

      <div className={styles.bottomGrid}>
        {/* Traffic Sources */}
        <div className={styles.sourcesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
               <Globe size={18} /> canais de Origem
            </h3>
          </div>
          <div className={styles.sourceList}>
            {sources.length > 0 ? sources.map((src, idx) => (
              <div key={idx} className={styles.sourceItem}>
                <span className={styles.sourceName}>{src.utm_source}</span>
                <div className={styles.sourceBarWrapper}>
                   <div 
                    className={styles.sourceBar} 
                    style={{ width: `${(src.count / (summary.total_views || 1)) * 100}%` }} 
                   />
                </div>
                <span className={styles.sourceCount}>{src.count}</span>
              </div>
            )) : (
              <p className={styles.emptyText}>Nenhuma origem externa detectada.</p>
            )}
          </div>
        </div>

        {/* conversion Funnel */}
        <div className={styles.funnelSection}>
           <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
               <MousePointer2 size={18} /> Funil de Resultados
            </h3>
          </div>
          <div className={styles.funnelList}>
            <div className={styles.funnelItem}>
              <div className={styles.funnelLabel}>Buscas</div>
              <div className={styles.funnelValue}>{summary.total_impressions}</div>
            </div>
            <div className={styles.funnelConnector} />
            <div className={styles.funnelItem}>
              <div className={styles.funnelLabel}>Cliques</div>
              <div className={styles.funnelValue}>{summary.total_views}</div>
            </div>
            <div className={styles.funnelConnector} />
            <div className={styles.funnelItem} style={{ borderLeftColor: '#10b981' }}>
              <div className={styles.funnelLabel}>Interessados</div>
              <div className={styles.funnelValue}>{summary.total_leads + summary.total_whatsapp}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
