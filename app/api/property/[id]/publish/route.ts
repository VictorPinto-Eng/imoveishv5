import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const userId = decoded.id;

    // Fetch property details
    const res = await query(`
      SELECT 
        p.id,
        p.nome,
        p.descricao,
        p.imbtpoperacao_id,
        tp.descricao as tipo_nome,
        op.descricao as operacao_nome,
        bai.descricao as bairro_nome,
        cid.descricao as cidade_nome,
        est.sigla as estado_sigla,
        carac.area_util,
        carac.dormitorio as dormitorios,
        carac.banheiro as banheiros,
        carac.vaga as vagas,
        COALESCE(pl.preco_base, pv.preco_base, 0) as preco_base,
        (SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC LIMIT 1) as foto_capa
      FROM public.produto_servico p
      LEFT JOIN public.produto_servico_carac carac ON p.id = carac.produto_servico_id
      LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
      LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
      LEFT JOIN imbtpimovel tp ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = tp.id
      LEFT JOIN imbtpoperacao op ON p.imbtpoperacao_id = op.id
      LEFT JOIN apoestado est ON p.estado_id = est.id
      LEFT JOIN apocidade cid ON p.cidade_id = cid.id
      LEFT JOIN apobairro bai ON p.bairro_id = bai.id
      WHERE p.id = $1 AND p.user_id = $2
    `, [id, userId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão' }, { status: 404 });
    }

    const imovel = res.rows[0];
    const n8nWebhookUrl = process.env.N8N_INSTAGRAM_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: 'URL do Webhook do n8n não configurada no servidor' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const priceFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(imovel.preco_base);

    const isRental = imovel.imbtpoperacao_id === 2;

    let imageUrl = imovel.foto_capa || null;
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    const payload = {
      id: imovel.id,
      title: imovel.nome,
      description: imovel.descricao,
      price: imovel.preco_base,
      priceFormatted: `${priceFormatted}${isRental ? '/mês' : ''}`,
      operation: imovel.operacao_nome,
      type: imovel.tipo_nome,
      area: imovel.area_util,
      bedrooms: imovel.dormitorios,
      bathrooms: imovel.banheiros,
      parking: imovel.vagas,
      location: [imovel.bairro_nome, imovel.cidade_nome, imovel.estado_sigla].filter(Boolean).join(' - '),
      url: `${baseUrl}/imovel/${imovel.id}`,
      imageUrl: imageUrl
    };

    console.log('[n8n Publish] Dispatching payload to:', n8nWebhookUrl, payload);

    // Call n8n webhook
    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!n8nRes.ok) {
      const errorText = await n8nRes.text();
      console.error('[n8n Publish] Error response from n8n:', errorText);
      return NextResponse.json({ error: `n8n retornou erro: ${n8nRes.status} ${errorText}` }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[n8n Publish] Exception:', error);
    return NextResponse.json({ error: 'Erro interno ao publicar no n8n' }, { status: 500 });
  }
}
