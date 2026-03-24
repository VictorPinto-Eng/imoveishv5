-- Schema para Log de Atividades (Audit Trail) e Leads

-- Tabela de Leads (Contatos do Site)
CREATE TABLE IF NOT EXISTS public.leads (
    id SERIAL PRIMARY KEY,
    produto_servico_id INTEGER NOT NULL REFERENCES public.produtos_servicos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    mensagem TEXT,
    status VARCHAR(50) DEFAULT 'novo', -- novo, lido, respondido, arquivado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Log de Auditoria (Ações Internas)
CREATE TABLE IF NOT EXISTS public.produtos_servicos_log (
    id SERIAL PRIMARY KEY,
    produto_servico_id INTEGER NOT NULL REFERENCES public.produtos_servicos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id),
    acao VARCHAR(100) NOT NULL, -- CRIACAO, ATUALIZACAO, EXCLUSAO, CLONAGEM, STATUS_ALTERADO, FOTO_ADICIONADA
    detalhes JSONB DEFAULT '{}', -- Salva o "De: / Para:" ou dados relevantes
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ps_log_produto ON public.produtos_servicos_log(produto_servico_id);
CREATE INDEX IF NOT EXISTS idx_ps_log_acao ON public.produtos_servicos_log(acao);
CREATE INDEX IF NOT EXISTS idx_ps_log_created ON public.produtos_servicos_log(created_at);
