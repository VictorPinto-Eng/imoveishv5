import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sanitizeLocationName } from '@/lib/sanitize-location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toUpperCase().trim();

    // Query for unique Cities
    const citiesPromise = query(`
      SELECT DISTINCT 
        custom_fields->>'cidade' as label,
        'cidade' as type,
        custom_fields->>'uf' as uf
      FROM produtos_servicos
      WHERE tipo = 'produto' AND categoria = 'Imovel' AND status = 'ativo' AND ativo = true
      AND (custom_fields->>'cidade') ILIKE $1
      LIMIT 5
    `, [`%${q}%`]);

    // Query for unique Neighborhoods
    const neighborhoodsPromise = query(`
      SELECT DISTINCT 
        custom_fields->>'bairro' as label,
        custom_fields->>'cidade' as city,
        'bairro' as type,
        custom_fields->>'uf' as uf
      FROM produtos_servicos
      WHERE tipo = 'produto' AND categoria = 'Imovel' AND status = 'ativo' AND ativo = true
      AND (custom_fields->>'bairro') ILIKE $1
      LIMIT 10
    `, [`%${q}%`]);
    // Query for unique Addresses (Logradouros)
    const logradourosPromise = query(`
      SELECT DISTINCT 
        logradouro as label,
        custom_fields->>'bairro' as neighborhood,
        custom_fields->>'cidade' as city,
        'endereco' as type,
        custom_fields->>'uf' as uf
      FROM produtos_servicos
      WHERE tipo = 'produto' AND categoria = 'Imovel' AND status = 'ativo' AND ativo = true
      AND logradouro ILIKE $1
      LIMIT 10
    `, [`%${q}%`]);

    const [citiesRes, neighborhoodsRes, logradourosRes] = await Promise.all([
      citiesPromise, 
      neighborhoodsPromise,
      logradourosPromise
    ]);

    const suggestions = [
      ...citiesRes.rows.map((row: any) => {
        const label = sanitizeLocationName(row.label);
        return {
          id: `city-${label}-${row.uf}`,
          label: label,
          sublabel: `Cidade - ${row.uf}`,
          type: 'cidade',
          city: label,
          uf: row.uf
        };
      }),
      ...neighborhoodsRes.rows.map((row: any) => {
        const label = sanitizeLocationName(row.label);
        const city = sanitizeLocationName(row.city);
        return {
          id: `bairro-${label}-${city}-${row.uf}`,
          label: label,
          sublabel: `Bairro, ${city} - ${row.uf}`,
          type: 'bairro',
          city: city,
          neighborhood: label,
          uf: row.uf
        };
      }),
      ...logradourosRes.rows.map((row: any) => {
        const rawLabel = row.label || '';
        const cleanLabel = rawLabel.split(',')[0].split('-')[0].trim();
        const label = sanitizeLocationName(cleanLabel);
        const neighborhood = sanitizeLocationName(row.neighborhood || '');
        const city = sanitizeLocationName(row.city);
        return {
          id: `address-${label}-${neighborhood}-${city}-${row.uf}`,
          label: label,
          sublabel: `${neighborhood ? neighborhood + ', ' : ''}${city} - ${row.uf}`,
          type: 'endereco',
          city: city,
          neighborhood: neighborhood,
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
