// SEC-01 reforçado: JWT_SECRET é obrigatório em runtime de produção.
// Durante o build do Next.js (NEXT_PHASE = 'phase-production-build'), env vars podem não estar
// disponíveis, então o throw só acontece em runtime real (quando um request chegar).

const secret = process.env.JWT_SECRET || '';

// Validação em tempo de import: apenas em produção + runtime (não durante build)
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

if (!secret && isServer && isProduction && !isBuildPhase) {
    throw new Error(
        '[FATAL] JWT_SECRET não está definido. O servidor não pode iniciar sem esta variável. ' +
        'Defina JWT_SECRET no ambiente de produção.'
    );
}

if (!secret && isServer && !isProduction) {
    console.warn('⚠️  JWT_SECRET não configurado. Usando string vazia (apenas aceitável em desenvolvimento).');
}

export const JWT_SECRET: string = secret;
