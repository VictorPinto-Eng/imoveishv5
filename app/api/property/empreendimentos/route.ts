import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT 
        e.id, 
        e.descricao,
        e.cep,
        e.possui_carac,
        b.descricao AS bairro_nome,
        c.descricao AS cidade_nome,
        est.nome AS estado_nome,
        est.sigla AS estado_sigla,
        (SELECT COUNT(*)::int FROM public.produto_servico p WHERE p.imbempreendimento_id = e.id AND p.statusimovel IN (1, 2)) AS total_unidades,
        (SELECT url_referencia FROM public.imbempreendimento_midia m WHERE m.imbempreendimento_id = e.id ORDER BY m.foto_principal DESC, m.ordem_exibicao ASC, m.id ASC LIMIT 1) AS foto_capa,
        ARRAY(SELECT url_referencia FROM public.imbempreendimento_midia m WHERE m.imbempreendimento_id = e.id ORDER BY m.ordem_exibicao ASC, m.id ASC) AS imagens_urls
      FROM public.imbempreendimento e
      LEFT JOIN public.apobairro b ON b.id = e.bairro_id
      LEFT JOIN public.apocidade c ON c.id = e.cidade_id
      LEFT JOIN public.apoestado est ON est.id = e.estado_id
      ORDER BY e.descricao
    `);
    return NextResponse.json({ empreendimentos: res.rows });
  } catch (error) {
    console.error('Error fetching empreendimentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar empreendimentos' }, { status: 500 });
  }
}

