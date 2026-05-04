import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPropertyTitlePrompt, generatePropertyTitleFallback } from '@/lib/property-title-prompt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Using -latest to ensure the SDK finds the stable version in any API endpoint
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
// High-availability fallback model
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function generateContentWithRetry(prompt: string, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Attempt with the primary stable model
            const result = await model.generateContent(prompt);
            return result;
        } catch (error: any) {
            console.warn(`Primary model attempt ${i+1} failed:`, error.message);
            
            // If it's a 404 (model not found) or 429 (quota), try the high-availability 8b model
            if ((error.status === 404 || error.status === 429) && i === 0) {
                try {
                    console.info('Switching to high-availability fallback model (8b)...');
                    const fbResult = await fallbackModel.generateContent(prompt);
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
