import { NextRequest, NextResponse } from 'next/server';

/**
 * SEC-07: Rate limiting in-memory por IP + endpoint.
 * Em produção com múltiplas instâncias, migrar para Redis ou tabela no banco.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Número máximo de requests no período */
  maxAttempts: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
}

const PRESETS = {
  /** Endpoints de login: 5 tentativas por 15 minutos */
  auth: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  /** Endpoints de envio de email: 3 por 10 minutos */
  email: { maxAttempts: 3, windowMs: 10 * 60 * 1000 },
  /** Endpoints gerais com limitação: 10 por minuto */
  general: { maxAttempts: 10, windowMs: 60 * 1000 },
} as const;

export type RateLimitPreset = keyof typeof PRESETS;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Verifica rate limit. Retorna NextResponse com 429 se excedido, ou null se liberado.
 */
export function checkRateLimit(
  req: NextRequest,
  endpoint: string,
  preset: RateLimitPreset | RateLimitOptions = 'general'
): NextResponse | null {
  const options = typeof preset === 'string' ? PRESETS[preset] : preset;
  const ip = getClientIp(req);
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > options.maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      { error: `Muitas tentativas. Aguarde ${retryAfterSeconds} segundos.` },
      {
        status: 429,
        headers: { 'Retry-After': retryAfterSeconds.toString() },
      }
    );
  }

  return null;
}