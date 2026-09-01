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
  // PERF-09: Configuração explícita do pool para produção
  max: 20,                       // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,      // Fecha conexão ociosa após 30s
  connectionTimeoutMillis: 5000, // Timeout para obter conexão do pool
  statement_timeout: 30000,      // Aborta queries que excedam 30s
});

// Wrapper para logar erros de query no servidor e fazer retry automático em caso de falha de conexão fria
export const query = async (text: string, params?: any[], retries = 2) => {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Tentativa ${attempt}/${retries} falhou na Query do Banco:`, error.message);
      if (attempt < retries) {
        // Aguarda 300ms antes de tentar novamente (conecta o pool frio)
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  console.error("❌ Erro definitivo na Query do Banco após retries:", {
    message: lastError?.message,
    code: lastError?.code,
    query: text.substring(0, 100) + "..."
  });
  throw lastError;
};

// Helper para transações — garante COMMIT ou ROLLBACK automático
export async function withTransaction<T>(fn: (client: { query: (text: string, params?: any[]) => Promise<any> }) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;

// Warm-up inicial do pool de conexões para evitar "cold start" na primeira requisição do cliente
pool.query('SELECT 1').then(() => {
  console.log('✅ Pool de conexões PostgreSQL aquecido com sucesso.');
}).catch(err => {
  console.warn('⚠️ Aviso no warm-up do PostgreSQL (será re-tentado na primeira query):', err.message);
});
