import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to create a lead in TomikCRM.
 * Replaces the old email-based contact system.
 */
export async function POST(req: NextRequest) {
  try {
    const { nome, email, telefone, mensagem, propertyId, propertyTitle } = await req.json();
    
    // Environment variables - Must be configured in .env.local
    const tomikUrl = process.env.TOMIKCRM_API_URL || 'https://api.tomik.com.br/leads'; // REPLACE with real URL if different
    const tomikToken = process.env.TOMIKCRM_TOKEN;

    if (!tomikToken) {
      console.warn('[TomikCRM] TOMIKCRM_TOKEN is not set in .env.local');
      // For now, let's just log and return 500 so the user knows they need the token
      return NextResponse.json({ 
        error: 'Conexão com CRM não configurada no servidor (falta Token).' 
      }, { status: 500 });
    }

    // Map the payload to TomikCRM format
    const payloadTomik = {
      nome_lead: nome,
      email: email || '',
      telefone: telefone || '',
      origem: 'Site HV5',
      status: 'novo',
      tags: ['Site', 'Lead', 'Imóvel'],
      mensagem: `${mensagem}\n\n--- Proposta sobre imóvel ---\nID: ${propertyId}\nTítulo: ${propertyTitle}`
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
        const errText = await resp.text();
        console.error('[TomikCRM] API Error:', resp.status, errText);
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
