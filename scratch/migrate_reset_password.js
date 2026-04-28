require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('Adding reset_password_token and reset_password_expires to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;');
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
