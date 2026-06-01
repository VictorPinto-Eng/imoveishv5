import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

// Helper to authenticate user
async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// GET: Retrieve all favorites of the user
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Select favorites along with property info
    const res = await query(`
      SELECT 
        p.*,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome,
        COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
        ARRAY(SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC) as all_photos
      FROM public.user_favorites f
      JOIN public.produtos_servicos p ON f.produto_servico_id = p.id
      LEFT JOIN public.imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON p.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON p.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
      LEFT JOIN public.apocidade CID ON p.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON p.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON p.estado_id = EST.id
      WHERE f.user_id = $1 AND p.ativo = true AND p.pub_site = true
      ORDER BY f.created_at DESC
    `, [userId]);

    // Parse favorites to match front-end format (mapping photos, etc.)
    const favorites = res.rows.map(row => {
      let imagens_urls: string[] = [];
      if (Array.isArray(row.all_photos) && row.all_photos.length > 0) {
        imagens_urls = row.all_photos;
      }

      return {
        ...row,
        imagens_urls,
        dormitorios: row.dormitorio,
        suites: row.suite,
        banheiros: row.banheiro,
        vagas: row.vaga,
        varandas: row.varanda,
        uf_nome: row.uf_nome,
        cidade_nome: row.cidade_nome,
        bairro_nome: row.bairro_nome,
        tipo_imovel_nome: row.tipo_nome || 'Imóvel'
      };
    });

    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

// POST: Add property to user favorites
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { propertyId } = await req.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'ID do imóvel não informado' }, { status: 400 });
    }

    // Insert on conflict do nothing to prevent duplicates
    await query(`
      INSERT INTO public.user_favorites (user_id, produto_servico_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, produto_servico_id) DO NOTHING
    `, [userId, propertyId]);

    return NextResponse.json({ success: true, message: 'Imóvel adicionado aos favoritos' });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Erro ao favoritar imóvel' }, { status: 500 });
  }
}

// DELETE: Remove property from user favorites
export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'ID do imóvel não informado' }, { status: 400 });
    }

    await query(`
      DELETE FROM public.user_favorites
      WHERE user_id = $1 AND produto_servico_id = $2
    `, [userId, Number(propertyId)]);

    return NextResponse.json({ success: true, message: 'Imóvel removido dos favoritos' });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Erro ao remover dos favoritos' }, { status: 500 });
  }
}
