import { query } from './lib/db';

async function migrate() {
  console.log('Starting migration: Adding codigo_evento to produtos_servicos_log...');
  try {
    await query(`
      ALTER TABLE produtos_servicos_log 
      ADD COLUMN IF NOT EXISTS codigo_evento VARCHAR(20),
      ADD COLUMN IF NOT EXISTS origem VARCHAR(50);
    `);
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
