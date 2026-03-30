import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, email, mensagem, codigo } = body;

    // 1. Record the lead in the local application database (leads table)
    try {
      if (codigo && name && email) {
        await query(`
          INSERT INTO leads (produto_servico_id, nome, email, telefone, mensagem)
          VALUES ($1, $2, $3, $4, $5)
        `, [Number(codigo), name, email, whatsapp, mensagem]);
        console.log('[Leads Proxy] Lead recorded in local DB.');
      }
    } catch (dbError) {
      // Log database error but don't block the webhook forwarding
      console.error('[Leads Proxy] Database insertion error:', dbError);
    }

    // 2. Forward the lead data to the external n8n webhook
    // This happens on the server side, so CORS is not an issue.
    const response = await fetch("https://webhook.hv5.srv.br/webhook/14b51c8e-0bbf-433f-94f0-a46773c31051", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Leads Proxy] Webhook error:', errorText);
      return NextResponse.json(
        { error: 'Falha ao enviar lead para o servidor de integração.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Leads Proxy] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar lead.' },
      { status: 500 }
    );
  }
}
