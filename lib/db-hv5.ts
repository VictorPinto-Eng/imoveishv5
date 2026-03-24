import { Pool } from 'pg';

const poolHv5 = new Pool({
  connectionString: process.env.HV5_DATABASE_URL,
});

export const queryHv5 = (text: string, params?: any[]) => poolHv5.query(text, params);

export default poolHv5;
