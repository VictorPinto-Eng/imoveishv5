import { NextRequest, NextResponse } from 'next/server';
import { queryHv5 } from '@/lib/db-hv5';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cidadeIdRaw = searchParams.get('cidade_id');
  const uf = searchParams.get('uf');
  const cidade = searchParams.get('cidade');

  if (!cidadeIdRaw && (!uf || !cidade)) {
    return NextResponse.json({ error: 'cidade_id or (UF and Cidade) are required' }, { status: 400 });
  }

  try {
    let cityId: number | null = null;

    if (cidadeIdRaw) {
      const parsed = Number(cidadeIdRaw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        cityId = parsed;
      }
    }

    if (!cityId && uf && cidade) {
      const stateRes = await queryHv5(
        'SELECT id FROM public.apoestado WHERE sigla = $1',
        [uf.toUpperCase()]
      );

      if (stateRes.rows.length === 0) {
        return NextResponse.json([]);
      }

      const estadoId = stateRes.rows[0].id;

      const cityRes = await queryHv5(
        'SELECT id FROM public.apocidade WHERE UPPER(descricao) = $1 AND estado_id = $2',
        [cidade.toUpperCase(), estadoId]
      );
      if (cityRes.rows.length > 0) {
        cityId = Number(cityRes.rows[0].id);
      }
    }

    if (!cityId) {
      return NextResponse.json([]);
    }

    const bairrosRes = await queryHv5(
      'SELECT id, descricao as nome FROM public.apobairro WHERE cidade_id = $1 ORDER BY descricao',
      [cityId]
    );

    return NextResponse.json(bairrosRes.rows);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json({ error: 'Erro ao buscar bairros' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { descricao, cidade_id, estado_id } = await req.json();
    const cleanDesc = descricao?.toUpperCase().trim();

    if (!cleanDesc || !cidade_id) {
      return NextResponse.json({ error: 'Descrição e cidade_id são obrigatórios' }, { status: 400 });
    }

    // Check if exists (fuzzy) in that city
    const checkRes = await queryHv5(
      `SELECT id FROM public.apobairro WHERE cidade_id = $1 AND (TRIM(UPPER(descricao)) = $2 OR translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = $2)`,
      [cidade_id, cleanDesc]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bairro já existe', 
        id: checkRes.rows[0].id
      });
    }

    const insertRes = await queryHv5(
      'INSERT INTO public.apobairro (descricao, cidade_id, estado_id) VALUES ($1, $2, $3) RETURNING id',
      [cleanDesc, cidade_id, estado_id || null]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Bairro cadastrado com sucesso', 
      id: insertRes.rows[0].id 
    });

  } catch (error: any) {
    console.error('Error creating bairro:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar bairro' }, { status: 500 });
  }
}
