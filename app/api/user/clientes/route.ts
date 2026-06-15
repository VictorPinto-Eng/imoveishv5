import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

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

async function getOrCreateEstado(sigla: string): Promise<number | null> {
  if (!sigla) return null;
  const cleanSigla = sigla.trim().toUpperCase();
  try {
    const res = await query(`
      SELECT id FROM public.apoestado 
      WHERE UPPER(sigla) = $1 
         OR translate(TRIM(UPPER(sigla)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = translate($1, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC')
      LIMIT 1
    `, [cleanSigla]);
    
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].id;
    }
  } catch (err) {
    console.error('Error resolving state:', err);
  }
  return null;
}

async function getOrCreateCidade(cidadeNome: string, estadoId: number): Promise<number | null> {
  if (!cidadeNome || !estadoId) return null;
  const cleanName = cidadeNome.trim().toUpperCase();
  try {
    const res = await query(`
      SELECT id FROM public.apocidade 
      WHERE estado_id = $1 
        AND (UPPER(descricao) = $2 
         OR translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = translate($2, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC'))
      LIMIT 1
    `, [estadoId, cleanName]);
    
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].id;
    }
    
    const insertRes = await query(`
      INSERT INTO public.apocidade (descricao, estado_id) 
      VALUES ($1, $2) 
      RETURNING id
    `, [cidadeNome.trim().toUpperCase(), estadoId]);
    
    if (insertRes.rowCount && insertRes.rowCount > 0) {
      return insertRes.rows[0].id;
    }
  } catch (err) {
    console.error('Error getOrCreateCidade:', err);
  }
  return null;
}

async function getOrCreateBairro(bairroNome: string, cidadeId: number, estadoId: number): Promise<number | null> {
  if (!bairroNome || !cidadeId) return null;
  const cleanName = bairroNome.trim().toUpperCase();
  try {
    // 1. Check if already exists
    const res = await query(`
      SELECT id FROM public.apobairro 
      WHERE cidade_id = $1 
        AND (UPPER(descricao) = $2 
         OR translate(TRIM(UPPER(descricao)), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = translate($2, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC'))
      LIMIT 1
    `, [cidadeId, cleanName]);
    
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].id;
    }
    
    // 2. Insert new bairro
    try {
      const insertRes = await query(`
        INSERT INTO public.apobairro (descricao, cidade_id, estado_id) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `, [cleanName, cidadeId, estadoId]);
      
      if (insertRes.rowCount && insertRes.rowCount > 0) {
        return insertRes.rows[0].id;
      }
    } catch (insertErr: any) {
      // 23505 = unique_violation — race condition: someone else inserted between our SELECT and INSERT
      if (insertErr.code === '23505') {
        console.warn('[getOrCreateBairro] Race condition — fetching existing record');
        const fallback = await query(`
          SELECT id FROM public.apobairro 
          WHERE cidade_id = $1 AND UPPER(TRIM(descricao)) = $2 
          LIMIT 1
        `, [cidadeId, cleanName]);
        if (fallback.rowCount && fallback.rowCount > 0) {
          return fallback.rows[0].id;
        }
      } else {
        throw insertErr;
      }
    }
  } catch (err) {
    console.error('Error getOrCreateBairro:', err);
  }
  return null;
}

// GET: Fetch customers or lookup metadata
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'estados-civis') {
      const res = await query(`SELECT id, nome FROM public.estados_civis WHERE ativo = true ORDER BY id`);
      return NextResponse.json({ success: true, list: res.rows });
    }

    if (type === 'tppessoa') {
      const res = await query(`SELECT id_tppessoa, descricao, sigla FROM public.tppessoa ORDER BY id_tppessoa`);
      return NextResponse.json({ success: true, list: res.rows });
    }

    if (type === 'regime-bens') {
      const res = await query(`SELECT id_regime, descricao, sigla FROM public.regime_bens ORDER BY descricao`);
      return NextResponse.json({ success: true, list: res.rows });
    }

    // Default: Fetch all customers created by this user
    const res = await query(`
      SELECT 
        c.*, 
        ec.nome as estado_civil_nome,
        est.sigla as estado_uf,
        est.nome as estado_nome,
        cid.descricao as cidade_nome,
        bai.descricao as bairro_nome,
        emissor_est.sigla as emissor_uf_sigla,
        nat_est.sigla as naturalidade_uf_sigla,
        nat_cid.descricao as naturalidade_cidade_nome,
        p.nome as nacionalidade_pais_nome,
        p.nacionalidade as nacionalidade_pais_nacionalidade,
        r.nome as profissao_nome,
        rb.descricao as regime_bens,
        cr.nome as conjuge_profissao
      FROM public.customer c
      LEFT JOIN public.estados_civis ec ON c.estadocivil_id = ec.id
      LEFT JOIN public.apoestado est ON c.estado_id = est.id
      LEFT JOIN public.apocidade cid ON c.cidade_id = cid.id
      LEFT JOIN public.apobairro bai ON c.bairro_id = bai.id
      LEFT JOIN public.apoestado emissor_est ON c.emissor_uf = emissor_est.id
      LEFT JOIN public.apoestado nat_est ON c.naturalidade_uf = nat_est.id
      LEFT JOIN public.apocidade nat_cid ON c.naturalidade_cidade = nat_cid.id
      LEFT JOIN public.apopais p ON c.nacionalidade = p.id
      LEFT JOIN public.ramosativ r ON c.profissao = r.id_ramosativ
      LEFT JOIN public.regime_bens rb ON c.regime_bens_id = rb.id_regime
      LEFT JOIN public.ramosativ cr ON c.conjuge_profissao = cr.id_ramosativ
      WHERE c.created_by = $1 AND c.ativo = 1
      ORDER BY c.created_at DESC
    `, [userId]);

    return NextResponse.json({ success: true, list: res.rows });
  } catch (error: any) {
    console.error('Error fetching customers/metadata:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

// POST: Register a new detailed customer in public.customer
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      tpPessoa, nome, cnpjcpf, email, cel, nascimento, 
      nacionalidade, naturalidade, naturalidadeCidadeId, naturalidadeUfId, estadoCivilId, regimeBens, profissao,
      identidade, emissor, emissorUf, dtEmissaoRg,
      conjugeNome, conjugeCpf, conjugeNascimento, conjugeProfissao, conjugeIdentidade, conjugeEmissor, conjugeEmissorUf,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      estadoId: estadoIdDirect, cidadeId: cidadeIdDirect, bairroId: bairroIdDirect
    } = body;

    if (!nome || !cnpjcpf) {
      return NextResponse.json({ error: 'Nome e CPF/CNPJ são obrigatórios' }, { status: 400 });
    }

    // Clean CPF/CNPJ and Phone
    const cleanDoc = cnpjcpf.replace(/\D/g, '');
    const cleanConjugeCpf = conjugeCpf ? conjugeCpf.replace(/\D/g, '') : null;
    const cleanCel = cel ? cel.replace(/\D/g, '') : null;

    // Clean Emissor fields (remove accents, convert to uppercase, keep only letters)
    const cleanEmissor = emissor
      ? emissor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;
    const cleanConjugeEmissor = conjugeEmissor
      ? conjugeEmissor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;
    const cleanConjugeEmissorUf = conjugeEmissorUf
      ? conjugeEmissorUf.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;

    // Resolve address IDs: prefer direct IDs sent from frontend, fallback to text-based lookup
    let estadoId: number | null = estadoIdDirect ? Number(estadoIdDirect) : null;
    let cidadeId: number | null = cidadeIdDirect ? Number(cidadeIdDirect) : null;
    let bairroId: number | null = bairroIdDirect ? Number(bairroIdDirect) : null;

    if (!estadoId && estado) {
      estadoId = await getOrCreateEstado(estado);
    }
    if (!cidadeId && cidade && estadoId) {
      cidadeId = await getOrCreateCidade(cidade, estadoId);
    }
    if (!bairroId && bairro && cidadeId && estadoId) {
      bairroId = await getOrCreateBairro(bairro, cidadeId, estadoId);
    }

    // Map person type id: 1 for JURIDICA, 2 for FISICA (reversing the previous incorrect assumption)
    let idTpPessoa = 2; // Default to FISICA (PF)
    if (tpPessoa === 'PJ' || String(tpPessoa) === '1') {
      idTpPessoa = 1;
    } else if (tpPessoa === 'PF' || String(tpPessoa) === '2') {
      idTpPessoa = 2;
    }

    // Check if customer with same CPF/CNPJ already registered for this user
    const checkRes = await query(
      `SELECT idcustomer FROM public.customer WHERE cnpjcpf = $1 AND created_by = $2 AND ativo = 1`,
      [cleanDoc, userId]
    );
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      return NextResponse.json({ error: 'Cliente já cadastrado com este CPF/CNPJ.' }, { status: 400 });
    }

    // Insert customer
    const insertRes = await query(`
      INSERT INTO public.customer (
        created_by, nome, cnpjcpf, id_tppessoa, email, cel, nascimento,
        nacionalidade, naturalidade_cidade, naturalidade_uf, estadocivil_id, regime_bens_id, profissao,
        identidade, emissor, emissor_uf, dt_emissao_rg,
        conjuge_nome, conjuge_cpf, conjuge_nascimento, conjuge_profissao, conjuge_identidade, conjuge_emissor, conjuge_emissor_uf,
        cep, logradouro, numero, complemento, bairro_id, cidade_id, estado_id, ativo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, 1
      ) RETURNING *
    `, [
      userId, nome, cleanDoc, idTpPessoa, email || null, cleanCel, nascimento || null,
      nacionalidade ? Number(nacionalidade) : null,
      naturalidadeCidadeId ? Number(naturalidadeCidadeId) : null,
      naturalidadeUfId ? Number(naturalidadeUfId) : null,
      estadoCivilId ? Number(estadoCivilId) : null, regimeBens ? Number(regimeBens) : null,
      profissao ? Number(profissao) : null,
      identidade || null, cleanEmissor, emissorUf ? Number(emissorUf) : null, dtEmissaoRg || null,
      conjugeNome || null, cleanConjugeCpf, conjugeNascimento || null, conjugeProfissao ? Number(conjugeProfissao) : null, conjugeIdentidade || null, cleanConjugeEmissor, cleanConjugeEmissorUf,
      cep || null, logradouro || null, numero || null, complemento || null, bairroId, cidadeId, estadoId
    ]);

    const newCustomer = insertRes.rows[0];
    const fullCustomerRes = await query(`
      SELECT 
        c.*, 
        ec.nome as estado_civil_nome,
        est.sigla as estado_uf,
        est.nome as estado_nome,
        cid.descricao as cidade_nome,
        bai.descricao as bairro_nome,
        emissor_est.sigla as emissor_uf_sigla,
        nat_est.sigla as naturalidade_uf_sigla,
        nat_cid.descricao as naturalidade_cidade_nome,
        p.nome as nacionalidade_pais_nome,
        p.nacionalidade as nacionalidade_pais_nacionalidade,
        r.nome as profissao_nome,
        rb.descricao as regime_bens,
        cr.nome as conjuge_profissao
      FROM public.customer c
      LEFT JOIN public.estados_civis ec ON c.estadocivil_id = ec.id
      LEFT JOIN public.apoestado est ON c.estado_id = est.id
      LEFT JOIN public.apocidade cid ON c.cidade_id = cid.id
      LEFT JOIN public.apobairro bai ON c.bairro_id = bai.id
      LEFT JOIN public.apoestado emissor_est ON c.emissor_uf = emissor_est.id
      LEFT JOIN public.apoestado nat_est ON c.naturalidade_uf = nat_est.id
      LEFT JOIN public.apocidade nat_cid ON c.naturalidade_cidade = nat_cid.id
      LEFT JOIN public.apopais p ON c.nacionalidade = p.id
      LEFT JOIN public.ramosativ r ON c.profissao = r.id_ramosativ
      LEFT JOIN public.regime_bens rb ON c.regime_bens_id = rb.id_regime
      LEFT JOIN public.ramosativ cr ON c.conjuge_profissao = cr.id_ramosativ
      WHERE c.idcustomer = $1
    `, [newCustomer.idcustomer]);

    return NextResponse.json({
      success: true,
      message: 'Cliente cadastrado com sucesso!',
      customer: fullCustomerRes.rows[0]
    });
  } catch (error: any) {
    console.error('Error inserting customer:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar cliente no banco de dados' }, { status: 500 });
  }
}

// PUT: Update an existing detailed customer in public.customer
export async function PUT(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      idcustomer, tpPessoa, nome, cnpjcpf, email, cel, nascimento, 
      nacionalidade, naturalidade, naturalidadeCidadeId, naturalidadeUfId, estadoCivilId, regimeBens, profissao,
      identidade, emissor, emissorUf, dtEmissaoRg,
      conjugeNome, conjugeCpf, conjugeNascimento, conjugeProfissao, conjugeIdentidade, conjugeEmissor, conjugeEmissorUf,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      estadoId: estadoIdDirect, cidadeId: cidadeIdDirect, bairroId: bairroIdDirect
    } = body;

    if (!idcustomer) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório para atualização' }, { status: 400 });
    }

    if (!nome || !cnpjcpf) {
      return NextResponse.json({ error: 'Nome e CPF/CNPJ são obrigatórios' }, { status: 400 });
    }

    // Check if customer exists and belongs to the user
    const existRes = await query(`SELECT idcustomer FROM public.customer WHERE idcustomer = $1 AND created_by = $2 AND ativo = 1`, [idcustomer, userId]);
    if (!existRes.rowCount || existRes.rowCount === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado ou não pertence a este usuário' }, { status: 404 });
    }

    // Clean CPF/CNPJ and Phone
    const cleanDoc = cnpjcpf.replace(/\D/g, '');
    const cleanConjugeCpf = conjugeCpf ? conjugeCpf.replace(/\D/g, '') : null;
    const cleanCel = cel ? cel.replace(/\D/g, '') : null;

    // Clean Emissor fields
    const cleanEmissor = emissor
      ? emissor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;
    const cleanConjugeEmissor = conjugeEmissor
      ? conjugeEmissor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;
    const cleanConjugeEmissorUf = conjugeEmissorUf
      ? conjugeEmissorUf.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
      : null;

    // Resolve address IDs: prefer direct IDs sent from frontend, fallback to text-based lookup
    let estadoId: number | null = estadoIdDirect ? Number(estadoIdDirect) : null;
    let cidadeId: number | null = cidadeIdDirect ? Number(cidadeIdDirect) : null;
    let bairroId: number | null = bairroIdDirect ? Number(bairroIdDirect) : null;

    if (!estadoId && estado) {
      estadoId = await getOrCreateEstado(estado);
    }
    if (!cidadeId && cidade && estadoId) {
      cidadeId = await getOrCreateCidade(cidade, estadoId);
    }
    if (!bairroId && bairro && cidadeId && estadoId) {
      bairroId = await getOrCreateBairro(bairro, cidadeId, estadoId);
    }

    // Map person type id: 1 for JURIDICA, 2 for FISICA
    let idTpPessoa = 2; // Default to FISICA (PF)
    if (tpPessoa === 'PJ' || String(tpPessoa) === '1') {
      idTpPessoa = 1;
    } else if (tpPessoa === 'PF' || String(tpPessoa) === '2') {
      idTpPessoa = 2;
    }

    // Check if another customer with same CPF/CNPJ already registered for this user
    const checkRes = await query(
      `SELECT idcustomer FROM public.customer WHERE cnpjcpf = $1 AND created_by = $2 AND idcustomer <> $3 AND ativo = 1`,
      [cleanDoc, userId, idcustomer]
    );
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      return NextResponse.json({ error: 'Outro cliente já está cadastrado com este CPF/CNPJ.' }, { status: 400 });
    }

    // Update customer
    await query(`
      UPDATE public.customer SET
        nome = $1, 
        cnpjcpf = $2, 
        id_tppessoa = $3, 
        email = $4, 
        cel = $5, 
        nascimento = $6,
        nacionalidade = $7, 
        naturalidade_cidade = $8, 
        naturalidade_uf = $9, 
        estadocivil_id = $10, 
        regime_bens_id = $11, 
        profissao = $12,
        identidade = $13, 
        emissor = $14, 
        emissor_uf = $15, 
        dt_emissao_rg = $16,
        conjuge_nome = $17, 
        conjuge_cpf = $18, 
        conjuge_nascimento = $19, 
        conjuge_profissao = $20, 
        conjuge_identidade = $21, 
        conjuge_emissor = $22, 
        conjuge_emissor_uf = $23,
        cep = $24, 
        logradouro = $25, 
        numero = $26, 
        complemento = $27, 
        bairro_id = $28, 
        cidade_id = $29, 
        estado_id = $30,
        updated_at = NOW()
      WHERE idcustomer = $31 AND created_by = $32
    `, [
      nome, cleanDoc, idTpPessoa, email || null, cleanCel, nascimento || null,
      nacionalidade ? Number(nacionalidade) : null,
      naturalidadeCidadeId ? Number(naturalidadeCidadeId) : null,
      naturalidadeUfId ? Number(naturalidadeUfId) : null,
      estadoCivilId ? Number(estadoCivilId) : null, regimeBens ? Number(regimeBens) : null,
      profissao ? Number(profissao) : null,
      identidade || null, cleanEmissor, emissorUf ? Number(emissorUf) : null, dtEmissaoRg || null,
      conjugeNome || null, cleanConjugeCpf, conjugeNascimento || null, conjugeProfissao ? Number(conjugeProfissao) : null, conjugeIdentidade || null, cleanConjugeEmissor, cleanConjugeEmissorUf,
      cep || null, logradouro || null, numero || null, complemento || null, bairroId, cidadeId, estadoId,
      idcustomer, userId
    ]);

    const fullCustomerRes = await query(`
      SELECT 
        c.*, 
        ec.nome as estado_civil_nome,
        est.sigla as estado_uf,
        est.nome as estado_nome,
        cid.descricao as cidade_nome,
        bai.descricao as bairro_nome,
        emissor_est.sigla as emissor_uf_sigla,
        nat_est.sigla as naturalidade_uf_sigla,
        nat_cid.descricao as naturalidade_cidade_nome,
        p.nome as nacionalidade_pais_nome,
        p.nacionalidade as nacionalidade_pais_nacionalidade,
        r.nome as profissao_nome,
        rb.descricao as regime_bens,
        cr.nome as conjuge_profissao
      FROM public.customer c
      LEFT JOIN public.estados_civis ec ON c.estadocivil_id = ec.id
      LEFT JOIN public.apoestado est ON c.estado_id = est.id
      LEFT JOIN public.apocidade cid ON c.cidade_id = cid.id
      LEFT JOIN public.apobairro bai ON c.bairro_id = bai.id
      LEFT JOIN public.apoestado emissor_est ON c.emissor_uf = emissor_est.id
      LEFT JOIN public.apoestado nat_est ON c.naturalidade_uf = nat_est.id
      LEFT JOIN public.apocidade nat_cid ON c.naturalidade_cidade = nat_cid.id
      LEFT JOIN public.apopais p ON c.nacionalidade = p.id
      LEFT JOIN public.ramosativ r ON c.profissao = r.id_ramosativ
      LEFT JOIN public.regime_bens rb ON c.regime_bens_id = rb.id_regime
      LEFT JOIN public.ramosativ cr ON c.conjuge_profissao = cr.id_ramosativ
      WHERE c.idcustomer = $1
    `, [idcustomer]);

    return NextResponse.json({
      success: true,
      message: 'Cliente atualizado com sucesso!',
      customer: fullCustomerRes.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente no banco de dados' }, { status: 500 });
  }
}
