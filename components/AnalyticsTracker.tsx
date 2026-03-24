'use client';

import { useEffect, useRef } from 'react';

interface AnalyticsTrackerProps {
  produto_servico_id: number;
  event_name: 'view_property' | 'click_whatsapp' | 'click_phone' | 'lead_submit' | 'share_property' | 'favorite_property' | 'schedule_visit';
  event_category?: string;
  payload?: any;
  triggerOnce?: boolean;
}

export default function AnalyticsTracker({ 
  produto_servico_id, 
  event_name, 
  event_category = 'navigation',
  payload = {},
  triggerOnce = true
}: AnalyticsTrackerProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (triggerOnce && hasTriggered.current) return;

    const track = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_servico_id,
            event_name,
            event_category,
            page_url: window.location.pathname,
            referrer: document.referrer,
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            payload
          })
        });
        
        hasTriggered.current = true;
      } catch (error) {
        console.error('[Analytics] Failed to track event:', error);
      }
    };

    track();
  }, [produto_servico_id, event_name, event_category, triggerOnce]);

  return null; // This component doesn't render anything
}
