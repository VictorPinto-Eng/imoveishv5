import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * API Route to create a lead in TomikCRM.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 leads por minuto por IP
    const limited = checkRateLimit(req, 'lead-contatar', { maxAttempts: 5, windowMs: 60_000 });
    if (limited) return limited;

    const { nome, email, telefone, mensagem, propertyId, propertyTitle } = await req.json();

    // Validação de input
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2 || nome.length > 200) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (telefone && (typeof telefone !== 'string' || telefone.length > 20)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }
    if (mensagem && (typeof mensagem !== 'string' || mensagem.length > 2000)) {
      return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 });
    }

    // Environment variables
    const tomikUrl = process.env.TOMIKCRM_API_URL || 'https://api.tomik.com.br/leads';
    const tomikToken = process.env.TOMIKCRM_TOKEN;

    if (!tomikToken) {
      console.warn('[TomikCRM] TOMIKCRM_TOKEN is not set');
      return NextResponse.json({
        error: 'Conexão com CRM não configurada no servidor.'
      }, { status: 500 });
    }

    const payloadTomik = {
      nome_lead: nome.trim(),
      email: (email || '').trim(),
      telefone: telefone || '',
      origem: 'Site HV5',
      status: 'novo',
      tags: ['Site', 'Lead', 'Imóvel'],
      mensagem: `${(mensagem || '').trim()}\n\n--- Proposta sobre imóvel ---\nID: ${propertyId || ''}\nTítulo: ${propertyTitle || ''}`
    };

    const resp = await fetch(tomikUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tomikToken}`
      },
      body: JSON.stringify(payloadTomik)
    });

    if (!resp.ok) {
      console.error('[TomikCRM] API Error:', resp.status);
      return NextResponse.json({
        error: 'Ocorreu um erro ao registrar o lead no CRM.'
      }, { status: resp.status });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[TomikCRM] Integration Error:', err);
    return NextResponse.json({ error: 'Erro interno ao processar lead.' }, { status: 500 });
  }
}
