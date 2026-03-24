
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('--- STARTING PHOTO MODULE MIGRATION ---');

    // 1. Create the new media table
    await query(`
      CREATE TABLE IF NOT EXISTS public.produtos_servicos_midia (
        id SERIAL PRIMARY KEY,
        produto_servico_id INTEGER REFERENCES public.produtos_servicos(id) ON DELETE CASCADE,
        url_referencia TEXT NOT NULL,
        tipo_midia VARCHAR(20) DEFAULT 'FOTO',
        ordem_exibicao INTEGER DEFAULT 0,
        foto_principal BOOLEAN DEFAULT FALSE,
        legenda TEXT,
        categoria VARCHAR(50) DEFAULT 'Fotos',
        privada BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('- Table produtos_servicos_midia created or exists.');

    // 2. Index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_midia_produto_id ON public.produtos_servicos_midia(produto_servico_id);
    `);

    // 3. Migrate existing photos
    const res = await query('SELECT id, imagens_urls FROM public.produtos_servicos WHERE imagens_urls IS NOT NULL');
    
    let migratedCount = 0;
    for (const row of res.rows) {
      if (row.imagens_urls && row.imagens_urls.length > 0) {
        for (let i = 0; i < row.imagens_urls.length; i++) {
          // Check if already exists to avoid duplicates
          const exists = await query(
            'SELECT id FROM public.produtos_servicos_midia WHERE produto_servico_id = $1 AND url_referencia = $2',
            [row.id, row.imagens_urls[i]]
          );
          
          if (exists.rowCount === 0) {
            await query(`
                INSERT INTO public.produtos_servicos_midia 
                (produto_servico_id, url_referencia, ordem_exibicao, foto_principal)
                VALUES ($1, $2, $3, $4)
            `, [row.id, row.imagens_urls[i], i + 1, i === 0]);
            migratedCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Migration completed', 
        migratedItems: migratedCount 
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
