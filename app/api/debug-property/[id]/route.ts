import { NextRequest, NextResponse } from 'next/server';
import { getImovelById } from '@/lib/imoveis';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Buscar via getImovelById
    const imovel = await getImovelById(id);

    // 2. Buscar diretamente do banco sem parse para ver colunas brutas
    const rawRes = await query(`
      SELECT
        I.id, I.nome, I.imbempreendimento_id,
        carac.*,
        emp_carac.*,
        emp_carac_self.*
      FROM public.produto_servico I
      LEFT JOIN public.produto_servico_carac carac ON I.id = carac.produto_servico_id
      LEFT JOIN public.imbempreendimento_carac emp_carac ON I.imbempreendimento_id = emp_carac.imbempreendimento_id
      LEFT JOIN public.imbempreendimento_carac emp_carac_self ON I.id = emp_carac_self.imbempreendimento_id
      WHERE I.id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      parsedImovel: imovel,
      rawDbRow: rawRes.rows[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
