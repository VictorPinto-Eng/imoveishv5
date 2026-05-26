import { Pool } from 'pg';
import { URL } from 'url';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL não encontrada! Verifique o arquivo .env no servidor.');
  // Continue with undefined, later validation will fail
}

// Validate that the connection points to the imob_hv5 database
if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    // pathname starts with '/' and contains the database name
    const dbName = dbUrl.pathname.replace(/^\//, '');
    if (dbName !== 'imob_hv5') {
      throw new Error(`Conexão de banco não permitida: esperado "imob_hv5", encontrado "${dbName}"`);
    }
  } catch (err) {
    console.error('❌ Erro na validação da URL do banco de dados:', err);
    // Fail fast – rethrow to prevent app start
    throw err;
  }
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
