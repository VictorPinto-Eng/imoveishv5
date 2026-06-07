import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sanitizeLocationName } from '@/lib/sanitize-location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toUpperCase().trim();

    // Query for unique Cities from the apocidade table
    const citiesPromise = query(`
      SELECT DISTINCT 
        c.descricao as label,
        'cidade' as type,
        e.sigla as uf
      FROM public.apocidade c
      LEFT JOIN public.apoestado e ON c.estado_id = e.id
      WHERE c.descricao ILIKE $1
      AND EXISTS (SELECT 1 FROM public.produto_servico WHERE cidade_id = c.id AND ativo = true)
      LIMIT 5
    `, [`%${q}%`]);

    // Query for unique Neighborhoods from the apobairro table
    const neighborhoodsPromise = query(`
      SELECT DISTINCT 
        b.descricao as label,
        c.descricao as city,
        'bairro' as type,
        e.sigla as uf
      FROM public.apobairro b
      JOIN public.apocidade c ON b.cidade_id = c.id
      LEFT JOIN public.apoestado e ON c.estado_id = e.id
      WHERE b.descricao ILIKE $1
      AND EXISTS (SELECT 1 FROM public.produto_servico WHERE bairro_id = b.id AND ativo = true)
      LIMIT 10
    `, [`%${q}%`]);

    // Query for unique Addresses (Logradouros)
    const logradourosPromise = query(`
      SELECT DISTINCT 
        I.logradouro as label,
        BAI.descricao as neighborhood,
        CID.descricao as city,
        'endereco' as type,
        EST.sigla as uf
      FROM public.produto_servico I
      LEFT JOIN public.apocidade CID ON I.cidade_id = CID.id
      LEFT JOIN public.apobairro BAI ON I.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON I.estado_id = EST.id
      WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true
      AND I.logradouro ILIKE $1
      LIMIT 10
    `, [`%${q}%`]);

    const [citiesRes, neighborhoodsRes, logradourosRes] = await Promise.all([
      citiesPromise, 
      neighborhoodsPromise,
      logradourosPromise
    ]);

    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const suggestions = [
      ...citiesRes.rows.map((row: any) => {
        const cityName = toTitleCase(row.label);
        return {
          id: `city-${row.label}-${row.uf}`,
          label: `${cityName} / ${row.uf}`,
          sublabel: '', // More clean as requested
          type: 'cidade',
          city: row.label,
          uf: row.uf
        };
      }),
      ...neighborhoodsRes.rows.map((row: any) => {
        const bairroName = toTitleCase(row.label);
        const cityName = toTitleCase(row.city);
        return {
          id: `bairro-${row.label}-${row.city}-${row.uf}`,
          label: `${bairroName} / ${cityName}`,
          sublabel: '',
          type: 'bairro',
          city: row.city,
          neighborhood: row.label,
          uf: row.uf
        };
      }),
      ...logradourosRes.rows.map((row: any) => {
        const rawLabel = row.label || '';
        const cleanLabel = rawLabel.split(',')[0].split('-')[0].trim();
        const addressName = toTitleCase(cleanLabel);
        const neighborhood = toTitleCase(row.neighborhood || '');
        return {
          id: `address-${row.label}-${row.neighborhood}-${row.city}-${row.uf}`,
          label: `${addressName}${neighborhood ? ' / ' + neighborhood : ''}`,
          sublabel: '',
          type: 'endereco',
          city: row.city,
          neighborhood: row.neighborhood,
          uf: row.uf
        };
      })
    ];

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 });
  }
}
