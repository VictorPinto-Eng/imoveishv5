
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => {
  console.log('[DB QUERY]', text, params);
  return pool.query(text, params);
};

export default pool;
