import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPropertyTitlePrompt, generatePropertyTitleFallback } from '@/lib/property-title-prompt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Switching to 1.5-flash for better stability and higher free-tier quotas
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function generateContentWithRetry(prompt: string, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error: any) {
            // If it's a rate limit error (429) and we have retries left
            if (error.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i + 1) * 1000;
                console.warn(`Gemini Rate Limit hit, retrying in ${delay}ms...`);
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    try {
        const prompt = buildPropertyTitlePrompt(data);
        const result = await generateContentWithRetry(prompt);
        const title = result.response.text().trim().replace(/"/g, '').replace(/\n/g, '');
        
        if (!title || title.length < 5) throw new Error('Empty AI response');
        
        return NextResponse.json({ title: title.toUpperCase() });
    } catch (aiError: any) {
        console.warn('AI Generation failed, using local fallback:', aiError.message);
        return NextResponse.json({ 
            title: generatePropertyTitleFallback(data), 
            isFallback: true,
            reason: aiError.status === 429 ? 'rate_limit' : 'error'
        });
    }
  } catch (error) {
    console.error('Error generating AI title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
