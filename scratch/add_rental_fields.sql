-- SQL para adicionar novos campos de valores e inclusão na locação
ALTER TABLE produtos_servicos 
ADD COLUMN IF NOT EXISTS seguro_incendio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS condominio_incluso BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS iptu_incluso BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seguro_incendio_incluso BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN produtos_servicos.seguro_incendio IS 'Valor do seguro incêndio';
COMMENT ON COLUMN produtos_servicos.condominio_incluso IS 'Indica se o condomínio está incluso no valor da locação';
COMMENT ON COLUMN produtos_servicos.iptu_incluso IS 'Indica se o IPTU está incluso no valor da locação';
COMMENT ON COLUMN produtos_servicos.seguro_incendio_incluso IS 'Indica se o seguro incêndio está incluso no valor da locação';
