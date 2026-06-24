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
    let dbSaved = false;
    let leadId: number | null = null;
    try {
      if (codigo && name && email) {
        const leadRes = await query(`
          INSERT INTO leads (produto_servico_id, user_id, nome, email, telefone, mensagem)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [Number(codigo), userId, name.trim(), email.trim(), whatsapp || null, mensagem || null]);
        dbSaved = true;
        leadId = leadRes.rows[0]?.id || null;
      }
    } catch (dbError: any) {
      console.error('[Leads Proxy] Database insertion error (leads):', dbError?.message || dbError);

      // Fallback: tentar sem user_id caso a coluna não exista
      if (!dbSaved && codigo && name && email) {
        try {
          const fallbackRes = await query(`
            INSERT INTO leads (produto_servico_id, nome, email, telefone, mensagem)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [Number(codigo), name.trim(), email.trim(), whatsapp || null, mensagem || null]);
          dbSaved = true;
          leadId = fallbackRes.rows[0]?.id || null;
        } catch (fallbackError: any) {
          console.error('[Leads Proxy] Fallback insertion error:', fallbackError?.message || fallbackError);
        }
      }
    }

    // Vincular lead ao cliente caso já exista no cadastro (por email ou telefone)
    if (dbSaved && leadId && (email || whatsapp)) {
      try {
        let customerRes = null;
        if (email) {
          customerRes = await query(
            `SELECT idcustomer FROM public.customer WHERE LOWER(email) = LOWER($1) AND ativo = 1 LIMIT 1`,
            [email.trim()]
          );
        }
        if ((!customerRes || !customerRes.rowCount || customerRes.rowCount === 0) && whatsapp) {
          const cleanPhone = whatsapp.replace(/\D/g, '');
          customerRes = await query(
            `SELECT idcustomer FROM public.customer WHERE REPLACE(REPLACE(REPLACE(cel, '(', ''), ')', ''), '-', '') = $1 AND ativo = 1 LIMIT 1`,
            [cleanPhone]
          );
        }
        if (customerRes && customerRes.rowCount && customerRes.rowCount > 0) {
          await query(
            `UPDATE public.leads SET cliente_id = $1 WHERE id = $2`,
            [customerRes.rows[0].idcustomer, leadId]
          );
        }
      } catch (linkError: any) {
        console.error('[Leads Proxy] Error linking lead to customer:', linkError?.message || linkError);
      }
    }

    // Registrar atendimento (independente do lead)
    try {
      if (codigo && name && email) {
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
    } catch (atenError: any) {
      console.error('[Leads Proxy] Atendimento insertion error:', atenError?.message || atenError);
    }

    // Se não conseguiu salvar o lead no banco, informar o usuário
    if (!dbSaved && codigo) {
      return NextResponse.json(
        { error: 'Não foi possível registrar seu contato. Tente novamente.' },
        { status: 500 }
      );
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
