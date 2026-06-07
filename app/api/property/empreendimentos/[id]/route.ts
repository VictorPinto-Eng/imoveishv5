import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(
      `SELECT 
        e.id, 
        e.descricao,
        e.cep,
        e.possui_carac,
        e.bairro_id,
        e.cidade_id,
        e.estado_id,
        e.pais_id,
        b.descricao AS bairro_nome,
        c.descricao AS cidade_nome,
        est.nome AS estado_nome,
        est.sigla AS estado_sigla,
        
        -- Characteristics
        carac.parque_aquatico, carac.salao_festas, carac.espaco_gourmet, carac.espaco_zen, carac.coworking,
        carac.piquenique, carac.espaco_grill, carac.pet_park, carac.supermarket, carac.espaco_gamer,
        carac.salao_jogos, carac.sala_cinema, carac.playground,
        carac.sala_yoga, carac.redario, carac.horta, carac.area_convivencia,
        carac.academia, carac.sala_funcional, carac.quadra_poliesportiva, carac.quadra_beach_tennis,
        carac.campo_futebol_society, carac.quadra_volei_praia, carac.quadra_tenis, carac.ciclovia, carac.pista_cooper,
        carac.controle_acesso_automatizado, carac.sala_encomendas_delivery, carac.wi_fi_areas_comuns
      FROM public.imbempreendimento e
      LEFT JOIN public.apobairro b ON b.id = e.bairro_id
      LEFT JOIN public.apocidade c ON c.id = e.cidade_id
      LEFT JOIN public.apoestado est ON est.id = e.estado_id
      LEFT JOIN public.imbempreendimento_carac carac ON e.id = carac.imbempreendimento_id
      WHERE e.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, empreendimento: res.rows[0] });
  } catch (error) {
    console.error('Error fetching empreendimento:', error);
    return NextResponse.json({ error: 'Erro ao buscar empreendimento' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      descricao, bairro_id, cidade_id, estado_id, pais_id, cep, possui_carac,
      // Characteristics
      parque_aquatico, salao_festas, espaco_gourmet, espaco_zen, coworking,
      piquenique, espaco_grill, pet_park, supermarket, espaco_gamer,
      salao_jogos, sala_cinema, playground,
      sala_yoga, redario, horta, area_convivencia,
      academia, sala_funcional, quadra_poliesportiva, quadra_beach_tennis,
      campo_futebol_society, quadra_volei_praia, quadra_tenis, ciclovia, pista_cooper,
      controle_acesso_automatizado, sala_encomendas_delivery, wi_fi_areas_comuns
    } = body;

    // Basic validation
    if (!descricao || !bairro_id || !cidade_id || !estado_id) {
      return NextResponse.json(
        { error: 'Os campos de Nome, Estado, Cidade e Bairro são obrigatórios.' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE public.imbempreendimento 
      SET 
        descricao = $1, 
        bairro_id = $2, 
        cidade_id = $3, 
        estado_id = $4, 
        pais_id = $5,
        cep = $6,
        possui_carac = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING id;
    `;

    const values = [
      descricao, 
      bairro_id, 
      cidade_id, 
      estado_id, 
      pais_id || 1, 
      cep || null,
      possui_carac === true || possui_carac === 'true',
      id
    ];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 });
    }

    // Upsert characteristics if possui_carac is enabled
    if (possui_carac === true || possui_carac === 'true') {
      const parseSmallInt = (val: any) => {
        if (val === true || val === 'true') return 1;
        if (val === false || val === 'false') return 0;
        const num = parseInt(val);
        return isNaN(num) ? 0 : num;
      };

      const caracQuery = `
        INSERT INTO public.imbempreendimento_carac (
          imbempreendimento_id,
          parque_aquatico, salao_festas, espaco_gourmet, espaco_zen, coworking,
          piquenique, espaco_grill, pet_park, supermarket, espaco_gamer,
          salao_jogos, sala_cinema, playground,
          sala_yoga, redario, horta, area_convivencia,
          academia, sala_funcional, quadra_poliesportiva, quadra_beach_tennis,
          campo_futebol_society, quadra_volei_praia, quadra_tenis, ciclovia, pista_cooper,
          controle_acesso_automatizado, sala_encomendas_delivery, wi_fi_areas_comuns,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, NOW()
        )
        ON CONFLICT (imbempreendimento_id) DO UPDATE SET
          parque_aquatico = EXCLUDED.parque_aquatico,
          salao_festas = EXCLUDED.salao_festas,
          espaco_gourmet = EXCLUDED.espaco_gourmet,
          espaco_zen = EXCLUDED.espaco_zen,
          coworking = EXCLUDED.coworking,
          piquenique = EXCLUDED.piquenique,
          espaco_grill = EXCLUDED.espaco_grill,
          pet_park = EXCLUDED.pet_park,
          supermarket = EXCLUDED.supermarket,
          espaco_gamer = EXCLUDED.espaco_gamer,
          salao_jogos = EXCLUDED.salao_jogos,
          sala_cinema = EXCLUDED.sala_cinema,
          playground = EXCLUDED.playground,
          sala_yoga = EXCLUDED.sala_yoga,
          redario = EXCLUDED.redario,
          horta = EXCLUDED.horta,
          area_convivencia = EXCLUDED.area_convivencia,
          academia = EXCLUDED.academia,
          sala_funcional = EXCLUDED.sala_funcional,
          quadra_poliesportiva = EXCLUDED.quadra_poliesportiva,
          quadra_beach_tennis = EXCLUDED.quadra_beach_tennis,
          campo_futebol_society = EXCLUDED.campo_futebol_society,
          quadra_volei_praia = EXCLUDED.quadra_volei_praia,
          quadra_tenis = EXCLUDED.quadra_tenis,
          ciclovia = EXCLUDED.ciclovia,
          pista_cooper = EXCLUDED.pista_cooper,
          controle_acesso_automatizado = EXCLUDED.controle_acesso_automatizado,
          sala_encomendas_delivery = EXCLUDED.sala_encomendas_delivery,
          wi_fi_areas_comuns = EXCLUDED.wi_fi_areas_comuns,
          updated_at = NOW();
      `;

      const caracValues = [
        id,
        parseSmallInt(parque_aquatico),
        parseSmallInt(salao_festas),
        parseSmallInt(espaco_gourmet),
        parseSmallInt(espaco_zen),
        parseSmallInt(coworking),
        parseSmallInt(piquenique),
        parseSmallInt(espaco_grill),
        parseSmallInt(pet_park),
        parseSmallInt(supermarket),
        parseSmallInt(espaco_gamer),
        parseSmallInt(salao_jogos),
        parseSmallInt(sala_cinema),
        parseSmallInt(playground),
        parseSmallInt(sala_yoga),
        parseSmallInt(redario),
        parseSmallInt(horta),
        parseSmallInt(area_convivencia),
        parseSmallInt(academia),
        parseSmallInt(sala_funcional),
        parseSmallInt(quadra_poliesportiva),
        parseSmallInt(quadra_beach_tennis),
        parseSmallInt(campo_futebol_society),
        parseSmallInt(quadra_volei_praia),
        parseSmallInt(quadra_tenis),
        parseSmallInt(ciclovia),
        parseSmallInt(pista_cooper),
        parseSmallInt(controle_acesso_automatizado),
        parseSmallInt(sala_encomendas_delivery),
        parseSmallInt(wi_fi_areas_comuns)
      ];

      await query(caracQuery, caracValues);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Empreendimento atualizado com sucesso.'
    });
  } catch (error: any) {
    console.error('Error updating empreendimento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar no banco de dados. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
