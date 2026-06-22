// Durante o build do Next.js (collecting page data), as env vars podem não estar disponíveis.
// O throw só acontece em runtime quando realmente precisar usar o JWT_SECRET.
const secret = process.env.JWT_SECRET || '';

if (!secret && typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
    console.warn('⚠️ JWT_SECRET não configurado. Autenticação não funcionará.');
}

export const JWT_SECRET: string = secret;
