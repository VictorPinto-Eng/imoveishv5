import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPropertyTitlePrompt, generatePropertyTitleFallback } from '@/lib/property-title-prompt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function POST(request: Request) {
  try {
    const data = await request.json();

    try {
        const prompt = buildPropertyTitlePrompt(data);
        const result = await model.generateContent(prompt);
        const title = result.response.text().trim().replace(/"/g, '').replace(/\n/g, '');
        
        if (!title || title.length < 5) throw new Error('Empty AI response');
        
        return NextResponse.json({ title: title.toUpperCase() });
    } catch (aiError: any) {
        console.warn('Gemini API Error, using local fallback:', aiError.message);
        return NextResponse.json({ title: generatePropertyTitleFallback(data), isFallback: true });
    }
  } catch (error) {
    console.error('Error generating AI title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
