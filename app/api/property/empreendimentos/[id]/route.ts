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
        e.bairro_id,
        e.cidade_id,
        e.estado_id,
        e.pais_id,
        b.descricao AS bairro_nome,
        c.descricao AS cidade_nome,
        est.nome AS estado_nome,
        est.sigla AS estado_sigla
      FROM public.imbempreendimento e
      LEFT JOIN public.apobairro b ON b.id = e.bairro_id
      LEFT JOIN public.apocidade c ON c.id = e.cidade_id
      LEFT JOIN public.apoestado est ON est.id = e.estado_id
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
    const { descricao, bairro_id, cidade_id, estado_id, pais_id, cep } = body;

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
        updated_at = NOW()
      WHERE id = $7
      RETURNING id;
    `;

    const values = [
      descricao, 
      bairro_id, 
      cidade_id, 
      estado_id, 
      pais_id || 1, 
      cep || null,
      id
    ];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 });
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
