const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

async function migrate() {
  console.log('Starting migration (No SSL): Adding codigo_evento and origem to produtos_servicos_log...');
  try {
    await pool.query(`
      ALTER TABLE produtos_servicos_log 
      ADD COLUMN IF NOT EXISTS codigo_evento VARCHAR(20),
      ADD COLUMN IF NOT EXISTS origem VARCHAR(50);
    `);
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

migrate();
