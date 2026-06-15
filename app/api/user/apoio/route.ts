import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch (err) {
    return null;
  }
}

function cleanString(str: any): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// GET: Fetch records from support tables
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  const searchParam = searchParams.get('search') || '';

  if (!table) {
    return NextResponse.json({ error: 'Parâmetro "table" é obrigatório' }, { status: 400 });
  }

  try {
    let rows: any[] = [];

    switch (table) {
      case 'ramosativ': {
        const idTpPessoaParam = searchParams.get('idTpPessoa');
        let queryStr = `
          SELECT r.*, tp.descricao as pessoa_tipo_desc 
          FROM public.ramosativ r
          LEFT JOIN public.tppessoa tp ON r.id_tppessoa = tp.id_tppessoa
        `;
        let queryParams: any[] = [];
        let conditions: string[] = [];

        if (idTpPessoaParam) {
          queryParams.push(Number(idTpPessoaParam));
          conditions.push(`r.id_tppessoa = $${queryParams.length}`);
        }

        if (searchParam) {
          queryParams.push(`%${cleanString(searchParam)}%`);
          conditions.push(`(unaccent(r.nome) ILIKE $${queryParams.length} OR unaccent(r.codativ) ILIKE $${queryParams.length})`);
        }

        if (conditions.length > 0) {
          queryStr += ` WHERE ` + conditions.join(' AND ');
        }
        queryStr += ` ORDER BY r.nome ASC`;
        const ramosRes = await query(queryStr, queryParams);
        rows = ramosRes.rows;
        break;
      }

      case 'apopais': {
        let queryStr = `SELECT * FROM public.apopais`;
        let queryParams: any[] = [];
        if (searchParam) {
          queryParams.push(`%${cleanString(searchParam)}%`);
          queryStr += ` WHERE unaccent(nome) ILIKE $1 OR unaccent(sigla) ILIKE $1 OR unaccent(nacionalidade) ILIKE $1`;
        }
        queryStr += ` ORDER BY nome ASC`;
        const paisRes = await query(queryStr, queryParams);
        rows = paisRes.rows;
        break;
      }

      case 'apoestado': {
        const paisIdParam = searchParams.get('paisId');
        let queryStr = `
          SELECT e.*, p.nome as pais_nome 
          FROM public.apoestado e 
          LEFT JOIN public.apopais p ON e.pais_id = p.id
        `;
        let queryParams: any[] = [];
        let conditions: string[] = [];
        if (paisIdParam) {
          queryParams.push(Number(paisIdParam));
          conditions.push(`e.pais_id = $${queryParams.length}`);
        }
        if (searchParam) {
          queryParams.push(`%${cleanString(searchParam)}%`);
          conditions.push(`(unaccent(e.nome) ILIKE $${queryParams.length} OR unaccent(e.sigla) ILIKE $${queryParams.length})`);
        }
        if (conditions.length > 0) {
          queryStr += ` WHERE ` + conditions.join(' AND ');
        }
        queryStr += ` ORDER BY e.nome ASC`;
        
        const estadoRes = await query(queryStr, queryParams);
        rows = estadoRes.rows;
        break;
      }

      case 'apocidade': {
        const estadoIdParam = searchParams.get('estadoId');
        let queryStr = `
          SELECT c.*, e.nome as estado_nome, e.sigla as estado_sigla 
          FROM public.apocidade c 
          LEFT JOIN public.apoestado e ON c.estado_id = e.id
        `;
        let queryParams: any[] = [];
        let conditions: string[] = [];
        if (estadoIdParam) {
          queryParams.push(Number(estadoIdParam));
          conditions.push(`c.estado_id = $${queryParams.length}`);
        }
        if (searchParam) {
          queryParams.push(`%${cleanString(searchParam)}%`);
          conditions.push(`unaccent(c.descricao) ILIKE $${queryParams.length}`);
        }
        if (conditions.length > 0) {
          queryStr += ` WHERE ` + conditions.join(' AND ');
        }
        queryStr += ` ORDER BY c.descricao ASC`;
        
        const cidadeRes = await query(queryStr, queryParams);
        rows = cidadeRes.rows;
        break;
      }

      case 'apobairro': {
        const cidadeIdParam = searchParams.get('cidadeId');
        let queryStr = `
          SELECT b.*, c.descricao as cidade_nome, e.sigla as estado_sigla 
          FROM public.apobairro b 
          LEFT JOIN public.apocidade c ON b.cidade_id = c.id 
          LEFT JOIN public.apoestado e ON b.estado_id = e.id 
        `;
        let queryParams: any[] = [];
        let bairroConditions: string[] = [];
        if (cidadeIdParam) {
          queryParams.push(Number(cidadeIdParam));
          bairroConditions.push(`b.cidade_id = $${queryParams.length}`);
        }
        if (searchParam) {
          queryParams.push(`%${cleanString(searchParam)}%`);
          bairroConditions.push(`unaccent(b.descricao) ILIKE $${queryParams.length}`);
        }
        if (bairroConditions.length > 0) {
          queryStr += ` WHERE ` + bairroConditions.join(' AND ');
        }
        queryStr += ` ORDER BY b.descricao ASC`;
        const bairroRes = await query(queryStr, queryParams);
        rows = bairroRes.rows;
        break;
      }

      default:
        return NextResponse.json({ error: 'Tabela de apoio inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true, list: rows });
  } catch (error: any) {
    console.error(`Error fetching support table ${table}:`, error);
    return NextResponse.json({ error: 'Erro ao buscar registros da tabela de apoio' }, { status: 500 });
  }
}

// POST: Add a new entry to the support tables
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { table } = body;

    if (!table) {
      return NextResponse.json({ error: 'Tabela de apoio não informada' }, { status: 400 });
    }

    let insertRes;

    switch (table) {
      case 'ramosativ': {
        const { nome, codativ, idTpPessoa } = body;
        if (!nome) return NextResponse.json({ error: 'O nome é obrigatório' }, { status: 400 });
        if (!idTpPessoa) return NextResponse.json({ error: 'O tipo de pessoa é obrigatório' }, { status: 400 });

        insertRes = await query(`
          INSERT INTO public.ramosativ (nome, codativ, id_tppessoa, created_by, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, NOW(), NOW()) 
          RETURNING *
        `, [
          cleanString(nome),
          cleanString(codativ) || null,
          idTpPessoa ? Number(idTpPessoa) : null,
          userId
        ]);
        break;
      }

      case 'apopais': {
        const { nome, sigla, nacionalidade } = body;
        if (!nome || !sigla || !nacionalidade) {
          return NextResponse.json({ error: 'Nome, Sigla e Nacionalidade são obrigatórios' }, { status: 400 });
        }

        insertRes = await query(`
          INSERT INTO public.apopais (nome, sigla, nacionalidade) 
          VALUES ($1, $2, $3) 
          RETURNING *
        `, [cleanString(nome), cleanString(sigla), cleanString(nacionalidade)]);
        break;
      }

      case 'apoestado': {
        const { nome, sigla, paisId, codigoIbge } = body;
        if (!nome || !sigla || !paisId) {
          return NextResponse.json({ error: 'Nome, Sigla e País são obrigatórios' }, { status: 400 });
        }

        insertRes = await query(`
          INSERT INTO public.apoestado (nome, sigla, pais_id, codigo_ibge) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `, [
          cleanString(nome),
          cleanString(sigla),
          Number(paisId),
          codigoIbge ? Number(codigoIbge) : null
        ]);
        break;
      }

      case 'apocidade': {
        const { descricao, estadoId, codigoIbge } = body;
        if (!descricao || !estadoId) {
          return NextResponse.json({ error: 'Descrição e Estado são obrigatórios' }, { status: 400 });
        }

        const descNorm = cleanString(descricao);

        // 1. Check if already exists (accent-insensitive)
        const cidadeExistente = await query(`
          SELECT * FROM public.apocidade 
          WHERE estado_id = $1 
            AND translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') 
              = translate($2, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC')
          LIMIT 1
        `, [Number(estadoId), descNorm]);

        if (cidadeExistente.rowCount && cidadeExistente.rowCount > 0) {
          // Already exists — return without inserting
          insertRes = cidadeExistente;
        } else {
          // 2. Insert new city
          insertRes = await query(`
            INSERT INTO public.apocidade (descricao, estado_id, codigo_ibge) 
            VALUES ($1, $2, $3) 
            RETURNING *
          `, [
            descNorm,
            Number(estadoId),
            codigoIbge ? Number(codigoIbge) : null
          ]);
        }
        break;
      }

      case 'apobairro': {
        const { descricao, cidadeId, estadoId } = body;
        if (!descricao || !cidadeId || !estadoId) {
          return NextResponse.json({ error: 'Descrição, Cidade e Estado são obrigatórios' }, { status: 400 });
        }

        const bairroDescNorm = cleanString(descricao);

        // 1. Check if already exists in this city (accent-insensitive)
        const bairroExistente = await query(`
          SELECT * FROM public.apobairro 
          WHERE cidade_id = $1 
            AND translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') 
              = translate($2, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC')
          LIMIT 1
        `, [Number(cidadeId), bairroDescNorm]);

        if (bairroExistente.rowCount && bairroExistente.rowCount > 0) {
          // Already exists — return without inserting
          console.log('[apoio] Bairro já existe, retornando existente:', bairroExistente.rows[0]);
          insertRes = bairroExistente;
        } else {
          // 2. Insert new bairro
          console.log('[apoio] Criando novo bairro:', bairroDescNorm, 'cidade_id:', cidadeId);
          insertRes = await query(`
            INSERT INTO public.apobairro (descricao, cidade_id, estado_id) 
            VALUES ($1, $2, $3) 
            RETURNING *
          `, [
            bairroDescNorm,
            Number(cidadeId),
            Number(estadoId)
          ]);
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Tabela de apoio inválida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Registro cadastrado com sucesso!',
      record: insertRes?.rows[0]
    });

  } catch (error: any) {
    // PostgreSQL unique constraint violation code = 23505
    // If a race condition triggered a duplicate, recover by fetching the existing record
    if (error.code === '23505') {
      console.warn('[apoio] Duplicate key violation — returning existing record');
      try {
        const body = await req.json().catch(() => ({}));
        const { table, descricao, cidadeId, estadoId } = body;
        if (table === 'apobairro' && descricao && cidadeId) {
          const existing = await query(
            `SELECT * FROM public.apobairro WHERE cidade_id = $1 AND UPPER(TRIM(descricao)) = $2 LIMIT 1`,
            [Number(cidadeId), descricao.trim().toUpperCase()]
          );
          if (existing.rowCount && existing.rowCount > 0) {
            return NextResponse.json({ success: true, message: 'Registro já existente', record: existing.rows[0] });
          }
        }
        if (table === 'apocidade' && descricao && estadoId) {
          const existing = await query(
            `SELECT * FROM public.apocidade WHERE estado_id = $1 AND UPPER(TRIM(descricao)) = $2 LIMIT 1`,
            [Number(estadoId), descricao.trim().toUpperCase()]
          );
          if (existing.rowCount && existing.rowCount > 0) {
            return NextResponse.json({ success: true, message: 'Registro já existente', record: existing.rows[0] });
          }
        }
      } catch (_) {}
    }
    console.error('[apoio] Error inserting support record:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar registro no banco de dados' }, { status: 500 });
  }
}
