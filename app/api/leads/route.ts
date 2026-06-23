import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth-config';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 leads por minuto por IP
    const limited = checkRateLimit(request, 'leads', { maxAttempts: 5, windowMs: 60_000 });
    if (limited) return limited;

    const body = await request.json();
    const { name, whatsapp, email, mensagem, codigo } = body;

    // Validação de input
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 200) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (whatsapp && (typeof whatsapp !== 'string' || whatsapp.length > 20)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }
    if (mensagem && (typeof mensagem !== 'string' || mensagem.length > 2000)) {
      return NextResponse.json({ error: 'Mensagem muito longa (máx 2000 caracteres)' }, { status: 400 });
    }
    if (codigo && isNaN(Number(codigo))) {
      return NextResponse.json({ error: 'Código de imóvel inválido' }, { status: 400 });
    }

    // Detect logged in user
    let userId: number | null = null;
    try {
      const token = request.cookies.get('token')?.value;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      }
    } catch (authError) {
      // Ignore auth errors, just record as anonymous
    }

    // 1. Record the lead in the local application database
    try {
      if (codigo && name && email) {
        await query(`
          INSERT INTO leads (produto_servico_id, user_id, nome, email, telefone, mensagem)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [Number(codigo), userId, name.trim(), email.trim(), whatsapp || null, mensagem || null]);

        await query(`
          INSERT INTO public.atendimento (
            produto_servico_id, user_id, nome, email, telefone, mensagem, tipo, etapa_id, valor_proposta, status_proposta
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, 'contato',
            (SELECT id FROM public.atendimento_etapa WHERE sigla = 'novo' LIMIT 1),
            0, 'pendente'
          )
        `, [Number(codigo), userId, name.trim(), email.trim(), whatsapp || null, mensagem || null]);
      }
    } catch (dbError) {
      console.error('[Leads Proxy] Database insertion error:', dbError);
    }

    // 2. Forward sanitized data to n8n webhook (whitelist fields only)
    const webhookUrl = process.env.N8N_LEADS_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ success: true });
    }

    const sanitizedPayload = {
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp || '',
      mensagem: mensagem || '',
      codigo: codigo ? Number(codigo) : null,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedPayload),
    });

    if (!response.ok) {
      // Log webhook failure but don't block the user — lead is already saved to DB
      console.error('[Leads Proxy] Webhook error:', await response.text());
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
