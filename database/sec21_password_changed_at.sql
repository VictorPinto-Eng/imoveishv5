-- ============================================================
-- SEC-21: Adicionar password_changed_at para invalidação de JWT
-- Projeto: imoveishv5
-- Data: 27/06/2026
--
-- Executar no banco imob_hv5
-- ============================================================

-- Coluna que registra o momento da última troca de senha.
-- Tokens JWT emitidos antes deste timestamp são considerados inválidos.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.password_changed_at IS 'Última troca de senha. JWTs com iat anterior a este valor são rejeitados (SEC-21).';
