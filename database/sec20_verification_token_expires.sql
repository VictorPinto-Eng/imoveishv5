-- ============================================================
-- SEC-20: Adicionar expiração ao token de verificação de email
-- Projeto: imoveishv5
-- Data: 27/06/2026
--
-- Executar no banco imob_hv5
-- ============================================================

-- Adicionar coluna de expiração do token de verificação
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.verification_token_expires IS 'Expiração do token de verificação de email (24h após geração). NULL = sem token ativo.';

-- Limpar tokens antigos sem expiração (tokens órfãos de contas nunca ativadas)
-- Opcional: executar manualmente se quiser invalidar tokens antigos
-- UPDATE public.users SET verification_token = NULL WHERE email_verified = FALSE AND created_at < NOW() - INTERVAL '7 days';
