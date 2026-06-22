import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPropertyTitlePrompt, generatePropertyTitleFallback } from '@/lib/property-title-prompt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth-config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function generateContentWithRetry(prompt: string, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Attempt with the primary stable model
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.95,
                    topP: 0.95,
                }
            });
            return result;
        } catch (error: any) {
            console.warn(`Primary model attempt ${i+1} failed:`, error.message);
            
            // If it's a 404 (model not found) or 429 (quota), try the high-availability 8b model
            if ((error.status === 404 || error.status === 429) && i === 0) {
                try {
                    console.info('Switching to high-availability fallback model (8b)...');
                    const fbResult = await fallbackModel.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.95,
                            topP: 0.95,
                        }
                    });
                    return fbResult;
                } catch (fbError: any) {
                    console.error('Fallback model also failed:', fbError.message);
                }
            }

            // Standard retry for rate limits
            if (error.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i + 1) * 1000;
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw new Error('All AI generation attempts failed');
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }

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
