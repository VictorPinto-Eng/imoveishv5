import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não encontrada! Verifique o arquivo .env no servidor.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrapper para logar erros de query no servidor
export const query = async (text: string, params?: any[]) => {
  try {
    return await pool.query(text, params);
  } catch (error: any) {
    console.error("❌ Erro na Query do Banco:", {
      message: error.message,
      code: error.code,
      query: text.substring(0, 100) + "..."
    });
    throw error;
  }
};

export default pool;
