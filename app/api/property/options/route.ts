import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Endpoint unificado que retorna todas as opções de referência em uma única chamada
// Substitui: /api/property/categories + /api/property/operacoes + /api/property/status + /api/property/empreendimentos
export async function GET() {
  try {
    const [categoriesRes, operacoesRes, statusRes, empreendimentosRes] = await Promise.all([
      query('SELECT id, descricao FROM imbfinalidade WHERE ativo = true ORDER BY descricao ASC'),
      query('SELECT id, descricao FROM imbtpoperacao WHERE ativo = true ORDER BY id ASC'),
      query('SELECT id, nome FROM statimovel WHERE ativo = true ORDER BY nome ASC'),
      query('SELECT id, descricao FROM public.imbempreendimento ORDER BY descricao')
    ]);

    return NextResponse.json({
      categories: categoriesRes.rows,
      operacoes: operacoesRes.rows,
      statuses: statusRes.rows,
      empreendimentos: empreendimentosRes.rows
    });
  } catch (error) {
    console.error('Error fetching property options:', error);
    return NextResponse.json({ error: 'Erro ao buscar opções' }, { status: 500 });
  }
}
