import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';
import { parseImoveis } from '@/lib/imoveis';

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
        (SELECT COUNT(*)::int FROM public.produto_servico ps WHERE ps.imbempreendimento_id = p.imbempreendimento_id AND ps.statusimovel IN (1, 2)) AS emp_total_unidades,
        (SELECT MIN(COALESCE(pl.preco_base, pv.preco_base, 0)) FROM public.produto_servico ps LEFT JOIN public.produto_servicos_loca pl ON ps.id = pl.produto_servico_id LEFT JOIN public.produto_servicos_venda pv ON ps.id = pv.produto_servico_id WHERE ps.imbempreendimento_id = p.imbempreendimento_id AND ps.statusimovel IN (1, 2)) AS emp_min_preco,
        (SELECT MIN(c.area_util) FROM public.produto_servico ps LEFT JOIN public.produto_servico_carac c ON ps.id = c.produto_servico_id WHERE ps.imbempreendimento_id = p.imbempreendimento_id AND ps.statusimovel IN (1, 2)) AS emp_min_area,
        carac.dormitorio, carac.suite, carac.varanda, carac.banheiro, carac.vaga, carac.areaservico, carac.quartoservico, carac.cozinha, carac.lavabo, carac.area_util, carac.area_construida, carac.area_terreno, carac.dimensoes_terreno, carac.sala, carac.parque_aquatico, carac.salao_festas, carac.espaco_gourmet, carac.espaco_zen, carac.coworking, carac.piquenique, carac.espaco_grill, carac.pet_park, carac.supermarket, carac.espaco_gamer, carac.salao_jogos, carac.sala_cinema, carac.playground, carac.sala_yoga, carac.redario, carac.horta, carac.area_convivencia, carac.espacos_gourmet_multiplos, carac.academia, carac.sala_funcional, carac.quadra_poliesportiva, carac.quadra_beach_tennis, carac.campo_futebol_society, carac.quadra_volei_praia, carac.quadra_tenis, carac.ciclovia, carac.pista_cooper, carac.controle_acesso_automatizado, carac.sala_encomendas_delivery, carac.wi_fi_areas_comuns,
        COALESCE(
          NULLIF(ARRAY(SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = p.id ORDER BY ordem_exibicao ASC, id ASC), '{}'),
          ARRAY(SELECT url_referencia FROM public.imbempreendimento_midia WHERE imbempreendimento_id = p.imbempreendimento_id ORDER BY ordem_exibicao ASC, id ASC)
        ) as all_photos,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        ST.nome as status_imovel_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome,
        PL.periodo_loca_id,
        PL.imbfinalidade_id as loc_imbfinalidade_id,
        PL.imbtpimovel_id as loc_imbtpimovel_id,
        PL.inclusocond,
        PL.pr_condominio,
        PL.inclusoiptu,
        PL.pr_iptuanual,
        PL.inclusoincendio,
        PL.pr_segincendio,
        PL.vrtotal,
        PL.preco_base as loc_preco_base,
        PV.imbfinalidade_id as venda_imbfinalidade_id,
        PV.imbtpimovel_id as venda_imbtpimovel_id,
        PV.pr_condominio as venda_pr_condominio,
        PV.pr_iptuanual as venda_pr_iptuanual,
        PV.pr_segincendio as venda_pr_segincendio,
        PV.vrtotal as venda_vrtotal,
        PV.preco_base as venda_preco_base,
        COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
        COALESCE(PL.imbfinalidade_id, PV.imbfinalidade_id) as imbfinalidade_id,
        COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) as imbtpimovel_id,
        U.phone as owner_phone
      FROM public.user_favorites f
      JOIN public.produto_servico p ON f.produto_servico_id = p.id
      LEFT JOIN public.produto_servico_carac carac ON p.id = carac.produto_servico_id
      LEFT JOIN public.users U ON p.user_id = U.id
      LEFT JOIN public.imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON p.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON p.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
      LEFT JOIN public.statimovel ST ON p.statusimovel = ST.id
      LEFT JOIN public.apocidade CID ON p.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON p.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON p.estado_id = EST.id
      WHERE f.user_id = $1 AND p.ativo = true AND p.pub_site = true
      ORDER BY f.created_at DESC
    `, [userId]);

    const favorites = parseImoveis(res.rows);

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
