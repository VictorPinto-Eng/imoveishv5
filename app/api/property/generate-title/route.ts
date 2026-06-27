import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPropertyTitlePrompt, generatePropertyTitleFallback } from '@/lib/property-title-prompt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth-config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Cache em memória de títulos gerados (chave = hash das características)
const titleCache = new Map<string, { title: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Rate limit por usuário: máximo 5 gerações por dia
const userDailyCount = new Map<number, { count: number; resetAt: number }>();
const MAX_DAILY_GENERATIONS = 5;

// Flag global: se Gemini retornou 429, desabilitar por 1 hora (evita spam de logs)
let quotaExhaustedUntil = 0;

function getCacheKey(data: any): string {
    const parts = [
        data.type || '',
        data.rooms || '',
        data.suites || '',
        data.parking || '',
        data.area || data.areaConstruida || '',
        data.objective || '',
        data.finalidade || ''
    ];
    return parts.join('|').toLowerCase();
}

function checkUserRate(userId: number): boolean {
    const now = Date.now();
    const entry = userDailyCount.get(userId);
    if (!entry || now > entry.resetAt) {
        userDailyCount.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
        return true;
    }
    if (entry.count >= MAX_DAILY_GENERATIONS) return false;
    entry.count++;
    return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms))
    ]);
}

async function generateWithAI(prompt: string) {
    try {
        const result = await withTimeout(
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.95, topP: 0.95 }
            }),
            5000
        );
        return result;
    } catch (error: any) {
        if (error.status === 429 || error.message === 'AI_TIMEOUT') {
            if (error.status === 429) {
                quotaExhaustedUntil = Date.now() + 60 * 60 * 1000; // desabilitar 1h
            }
            throw error;
        }
        // Tenta lite uma vez
        const fbResult = await withTimeout(
            fallbackModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.95, topP: 0.95 }
            }),
            5000
        );
        return fbResult;
    }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }

    const data = await request.json();
    const cacheKey = getCacheKey(data);

    // 1. Verificar cache
    const cached = titleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({ title: cached.title, fromCache: true });
    }

    // 2. Verificar rate limit do usuário
    if (!checkUserRate(userId)) {
        return NextResponse.json({
            title: generatePropertyTitleFallback(data),
            isFallback: true,
            reason: 'daily_limit'
        });
    }

    // 3. Verificar se quota do Gemini está esgotada (cooldown de 1h)
    if (Date.now() < quotaExhaustedUntil) {
        const fallbackTitle = generatePropertyTitleFallback(data);
        titleCache.set(cacheKey, { title: fallbackTitle, timestamp: Date.now() });
        return NextResponse.json({
            title: fallbackTitle,
            isFallback: true,
            reason: 'quota_cooldown'
        });
    }

    // 4. Tentar gerar com IA
    try {
        const prompt = buildPropertyTitlePrompt(data);
        const result = await generateWithAI(prompt);
        const title = result.response.text().trim().replace(/"/g, '').replace(/\n/g, '');

        if (!title || title.length < 5) throw new Error('Empty AI response');

        const finalTitle = title.toUpperCase();
        titleCache.set(cacheKey, { title: finalTitle, timestamp: Date.now() });
        return NextResponse.json({ title: finalTitle });
    } catch (aiError: any) {
        const fallbackTitle = generatePropertyTitleFallback(data);
        titleCache.set(cacheKey, { title: fallbackTitle, timestamp: Date.now() });
        return NextResponse.json({
            title: fallbackTitle,
            isFallback: true,
            reason: aiError.status === 429 ? 'rate_limit' : 'error'
        });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar título' }, { status: 500 });
  }
}
