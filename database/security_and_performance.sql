-- ============================================================
-- SECURITY & PERFORMANCE - Instruções SQL para Produção
-- Projeto: imoveishv5
-- Data: 21/06/2026
-- 
-- IMPORTANTE: Executar nesta ordem no banco imob_hv5
-- Recomenda-se executar em horário de baixo tráfego.
-- ============================================================

-- ============================================================
-- PARTE 1: SEGURANÇA - Novas Tabelas
-- ============================================================

-- 1.1 Audit Log (Registro de ações sensíveis de segurança)
-- Cobre: login, logout, reset senha, mudança de role, ações admin
CREATE TABLE IF NOT EXISTS public.audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    -- Ações: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_RESET_REQUEST,
    -- PASSWORD_RESET_COMPLETE, PASSWORD_CHANGED, ACCOUNT_LOCKED, 
    -- ADMIN_ACTION, ROLE_CHANGED, EMAIL_VERIFIED, ACCOUNT_DELETED
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON public.audit_log(ip_address);

COMMENT ON TABLE public.audit_log IS 'Registro de segurança: login, logout, alterações sensíveis, ações admin';

-- 1.2 Colunas de segurança na tabela users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_login_ip INET,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.users.failed_login_attempts IS 'Contador de tentativas de login falhadas consecutivas';
COMMENT ON COLUMN public.users.locked_until IS 'Conta bloqueada até esta data (NULL = desbloqueada)';
COMMENT ON COLUMN public.users.last_login_at IS 'Último login bem-sucedido';
COMMENT ON COLUMN public.users.last_login_ip IS 'IP do último login bem-sucedido';


-- ============================================================
-- PARTE 2: PERFORMANCE - Indexes para Queries Principais
-- ============================================================

-- 2.1 Index composto principal para listagem pública de imóveis
-- Usado em: getImoveis(), getFeaturedImoveis(), getRecentImoveis()
-- Query base: WHERE tipo='produto' AND categoria='Imovel' AND ativo=true AND pub_site=true
CREATE INDEX IF NOT EXISTS idx_produto_servico_listagem_publica 
    ON public.produto_servico(tipo, categoria, ativo, pub_site)
    WHERE tipo = 'produto' AND categoria = 'Imovel' AND ativo = true AND pub_site = true;

-- 2.2 Index para ordenação por data (listagem mais recentes)
CREATE INDEX IF NOT EXISTS idx_produto_servico_created_desc 
    ON public.produto_servico(created_at DESC)
    WHERE tipo = 'produto' AND categoria = 'Imovel' AND ativo = true AND pub_site = true;

-- 2.3 Index para ordenação por atualização (oportunidades/preço atualizado)
CREATE INDEX IF NOT EXISTS idx_produto_servico_updated_desc 
    ON public.produto_servico(updated_at DESC)
    WHERE tipo = 'produto' AND categoria = 'Imovel' AND ativo = true AND pub_site = true;

-- 2.4 Index para filtro por tipo de operação (venda/aluguel)
CREATE INDEX IF NOT EXISTS idx_produto_servico_operacao 
    ON public.produto_servico(imbtpoperacao_id)
    WHERE ativo = true AND pub_site = true;

-- 2.5 Index para filtro por cidade
CREATE INDEX IF NOT EXISTS idx_produto_servico_cidade 
    ON public.produto_servico(cidade_id)
    WHERE ativo = true AND pub_site = true;

-- 2.6 Index para filtro por bairro
CREATE INDEX IF NOT EXISTS idx_produto_servico_bairro 
    ON public.produto_servico(bairro_id)
    WHERE ativo = true AND pub_site = true;

-- 2.7 Index para busca por proprietário (meus-imoveis, ownership check)
CREATE INDEX IF NOT EXISTS idx_produto_servico_user 
    ON public.produto_servico(user_id);

-- 2.8 Index para JOIN de características
CREATE INDEX IF NOT EXISTS idx_produto_servico_carac_fk 
    ON public.produto_servico_carac(produto_servico_id);

-- 2.9 Index para JOIN de locação
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_loca_fk 
    ON public.produto_servicos_loca(produto_servico_id);

-- 2.10 Index para JOIN de venda
CREATE INDEX IF NOT EXISTS idx_produto_servicos_venda_fk 
    ON public.produto_servicos_venda(produto_servico_id);

-- 2.11 Index para mídia (fotos) com ordenação
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_midia_ordem 
    ON public.produtos_servicos_midia(produto_servico_id, ordem_exibicao ASC);

-- 2.12 Index para users por email (login, registro, check-email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email 
    ON public.users(email);

-- 2.13 Index para leads por imóvel
CREATE INDEX IF NOT EXISTS idx_leads_produto 
    ON public.leads(produto_servico_id, created_at DESC);

-- 2.14 Index para atendimento por imóvel (CRM/Negócios)
CREATE INDEX IF NOT EXISTS idx_atendimento_produto 
    ON public.atendimento(produto_servico_id);

-- 2.15 Index para atendimento por user (painel do corretor)
CREATE INDEX IF NOT EXISTS idx_atendimento_user 
    ON public.atendimento(user_id);

-- 2.16 Index para mensagens do atendimento (chat)
CREATE INDEX IF NOT EXISTS idx_atendimento_mensagens_atendimento 
    ON public.atendimento_mensagens(atendimento_id, created_at ASC);

-- 2.17 Index para mensagens não lidas (badge de notificação)
CREATE INDEX IF NOT EXISTS idx_atendimento_mensagens_nao_lidas 
    ON public.atendimento_mensagens(atendimento_id, sender_type, lida)
    WHERE lida = false;

-- 2.18 Index para log de atendimento
CREATE INDEX IF NOT EXISTS idx_atendimento_log_atendimento 
    ON public.atendimento_log(atendimento_id, created_at DESC);

-- 2.19 Index para empreendimento mídia
CREATE INDEX IF NOT EXISTS idx_imbempreendimento_midia_fk 
    ON public.imbempreendimento_midia(imbempreendimento_id, ordem_exibicao ASC);


-- ============================================================
-- PARTE 3: MANUTENÇÃO - Limpeza e ANALYZE
-- ============================================================

-- 3.1 Atualizar estatísticas das tabelas principais após criar indexes
ANALYZE public.produto_servico;
ANALYZE public.produto_servico_carac;
ANALYZE public.produto_servicos_loca;
ANALYZE public.produto_servicos_venda;
ANALYZE public.produtos_servicos_midia;
ANALYZE public.users;
ANALYZE public.leads;
ANALYZE public.atendimento;
ANALYZE public.atendimento_mensagens;


-- ============================================================
-- PARTE 4: VERIFICAÇÃO
-- ============================================================

-- Executar após aplicar para confirmar que os indexes foram criados:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;