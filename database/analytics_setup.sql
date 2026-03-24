-- Ultra-simplified Analytics Setup
-- No sequences (using SERIAL), no grants, no owners.

CREATE TABLE IF NOT EXISTS public.produto_servico_net (
    id SERIAL PRIMARY KEY,
    produto_servico_id INTEGER NOT NULL UNIQUE,
    slug VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    organization_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id SERIAL PRIMARY KEY,
    produto_servico_net_id INTEGER NOT NULL REFERENCES public.produto_servico_net(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    visitor_id VARCHAR(255),
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    page_url TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    ip_address INET,
    user_id INTEGER,
    organization_id INTEGER,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_metrics (
    id SERIAL PRIMARY KEY,
    produto_servico_net_id INTEGER NOT NULL REFERENCES public.produto_servico_net(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    organization_id INTEGER,
    visualizacoes INTEGER DEFAULT 0,
    cliques_whatsapp INTEGER DEFAULT 0,
    cliques_telefone INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    compartilhamentos INTEGER DEFAULT 0,
    favoritos INTEGER DEFAULT 0,
    agendamentos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_servico_net_id, data_referencia)
);

CREATE INDEX IF NOT EXISTS idx_ps_net_ref ON public.produto_servico_net(produto_servico_id);
CREATE INDEX IF NOT EXISTS idx_events_ps_net ON public.analytics_events(produto_servico_net_id);
CREATE INDEX IF NOT EXISTS idx_events_name_date ON public.analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_ps_net_date ON public.analytics_daily_metrics(produto_servico_net_id, data_referencia);
