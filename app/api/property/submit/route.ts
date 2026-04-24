import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { queryHv5 } from '@/lib/db-hv5';
import { sanitizeLocationName } from '@/lib/sanitize-location';
import { JWT_SECRET } from '@/lib/auth-config';
import { recordAuditLog } from '@/lib/analytics-service';

export async function POST(req: NextRequest) {
  try {
    // Auth
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const userId = decoded.id;

    const data = await req.json();
    const {
      address, cep, number, complement, quadra_torre_bloco, unidade, andar,
      estadoId, cidadeId, bairroId, uf, cidade, bairro,
      autoCreateBairro,
      objective, acceptsPets, relationship,
      finalidade, type, rooms, bathrooms, suites, parking, area,
      varandas, areaservico, quartoservico, cozinha, lavabo, sala, dimensoes_terreno,
      area_construida, area_terreno,
      title, description, price,
      condoFee, iptuValue, hasIptu, status,
      latitude, longitude, plus_code,
      imbtpoperacao_id, imbfinalidade_id, imbtpimovel_id, statusimovel,
      pub_site, pub_price
    } = data;

  const ufSigla = sanitizeLocationName(String(uf || ''));
  const cidadeNome = sanitizeLocationName(String(cidade || ''));
  const bairroNome = sanitizeLocationName(String(bairro || ''));

  const resolveLocationIds = async () => {
    let resolvedEstadoId = Number(estadoId) || null;
    let resolvedCidadeId = Number(cidadeId) || null;
    let resolvedBairroId = Number(bairroId) || null;
    let resolvedPaisId: number | null = null;
    
    console.log(`[DEBUG Location Submit] Input IDs: EF=${resolvedEstadoId}, CID=${resolvedCidadeId}, BAI=${resolvedBairroId}`);
    console.log(`[DEBUG Location Submit] Input Names: UF=${ufSigla}, CID=${cidadeNome}, BAI=${bairroNome}`);

    // Helper to standardise matching with accents and trim spaces
    const fuzzyMatchSql = (col: string, idx: number) => `(TRIM(UPPER(${col})) = $${idx} OR translate(TRIM(UPPER(${col})), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') = $${idx})`;

    // 1. Resolve Estado
    if (!resolvedEstadoId && ufSigla) {
      const estadoRes = await queryHv5(
        `SELECT id, pais_id, sigla FROM public.apoestado WHERE ${fuzzyMatchSql('sigla', 1)}`,
        [ufSigla]
      );
      if (estadoRes.rows.length > 0) {
        resolvedEstadoId = Number(estadoRes.rows[0].id);
        resolvedPaisId = estadoRes.rows[0].pais_id ? Number(estadoRes.rows[0].pais_id) : null;

        // Auto-update master table if name is not standardized
        if (estadoRes.rows[0].sigla !== ufSigla) {
          console.log(`[DEBUG Location Submit] Standardizing Estado Sigla: ${estadoRes.rows[0].sigla} -> ${ufSigla}`);
          await queryHv5('UPDATE public.apoestado SET sigla = $1 WHERE id = $2', [ufSigla, resolvedEstadoId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Estado ID: ${resolvedEstadoId}`);
      } else {
        // Auto-create Estado
        console.log(`[DEBUG Location Submit] Creating Estado: ${ufSigla}`);
        const insertEstado = await queryHv5(
          'INSERT INTO public.apoestado (nome, sigla, pais_id) VALUES ($1, $2, $3) RETURNING id',
          [ufSigla, ufSigla, 1] // Default to pais_id 1
        );
        if (insertEstado.rows.length > 0) {
          resolvedEstadoId = Number(insertEstado.rows[0].id);
          resolvedPaisId = 1;
          console.log(`[DEBUG Location Submit] Created Estado ID: ${resolvedEstadoId}`);
        }
      }
    }

    // 2. Resolve Cidade
    if (!resolvedCidadeId && cidadeNome && resolvedEstadoId) {
      const cidadeRes = await queryHv5(
        `SELECT id, descricao FROM public.apocidade WHERE estado_id = $1 AND ${fuzzyMatchSql('descricao', 2)}`,
        [resolvedEstadoId, cidadeNome]
      );
      if (cidadeRes.rows.length > 0) {
        resolvedCidadeId = Number(cidadeRes.rows[0].id);

        // Auto-update master table if name is not standardized
        if (cidadeRes.rows[0].descricao !== cidadeNome) {
          console.log(`[DEBUG Location Submit] Standardizing Cidade: ${cidadeRes.rows[0].descricao} -> ${cidadeNome}`);
          await queryHv5('UPDATE public.apocidade SET descricao = $1 WHERE id = $2', [cidadeNome, resolvedCidadeId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Cidade ID: ${resolvedCidadeId}`);
      } else {
        // Auto-create Cidade
        console.log(`[DEBUG Location Submit] Creating Cidade: ${cidadeNome}`);
        const insertCidade = await queryHv5(
          'INSERT INTO public.apocidade (descricao, estado_id) VALUES ($1, $2) RETURNING id',
          [cidadeNome, resolvedEstadoId]
        );
        if (insertCidade.rows.length > 0) {
          resolvedCidadeId = Number(insertCidade.rows[0].id);
          console.log(`[DEBUG Location Submit] Created Cidade ID: ${resolvedCidadeId}`);
        }
      }
    }

    // 3. Resolve Bairro
    if (!resolvedBairroId && bairroNome && resolvedCidadeId) {
      const bairroRes = await queryHv5(
        `SELECT id, descricao FROM public.apobairro WHERE cidade_id = $1 AND ${fuzzyMatchSql('descricao', 2)} AND estado_id = $3 LIMIT 1`,
        [resolvedCidadeId, bairroNome, resolvedEstadoId]
      );

      if (bairroRes.rows.length > 0) {
        resolvedBairroId = Number(bairroRes.rows[0].id);

        // Auto-update master table if name is not standardized
        if (bairroRes.rows[0].descricao !== bairroNome) {
          console.log(`[DEBUG Location Submit] Standardizing Bairro: ${bairroRes.rows[0].descricao} -> ${bairroNome}`);
          await queryHv5('UPDATE public.apobairro SET descricao = $1 WHERE id = $2', [bairroNome, resolvedBairroId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Bairro ID: ${resolvedBairroId}`);
      } else {
        // Bairro resolution (Pure lookup)
        const bairroRes = await queryHv5(
          `SELECT id FROM public.apobairro WHERE cidade_id = $1 AND ${fuzzyMatchSql('descricao', 2)}`,
          [resolvedCidadeId, bairroNome]
        );
        if (bairroRes.rows.length > 0) {
          resolvedBairroId = Number(bairroRes.rows[0].id);
        }
        console.log(`[DEBUG Location Submit] Resolved Bairro ID: ${resolvedBairroId}`);
      }
    }

    return {
      paisId: resolvedPaisId,
      estadoId: resolvedEstadoId,
      cidadeId: resolvedCidadeId,
      bairroId: resolvedBairroId,
    };
  };

    // Parse price to number
    const parsePriceBR = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const str = String(val);
      if (str.includes(',')) {
        return parseFloat(str.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      }
      return parseFloat(str.replace(/[R$\s]/g, '')) || 0;
    };

    const precoBase = parsePriceBR(price);
    const condoFeeNum = parsePriceBR(condoFee);
    const iptuNum = parsePriceBR(iptuValue);
    const resolvedLocation = await resolveLocationIds();

    // Sanitization of Address fields (Uppercase + Accents removal)
    const addressSanitized = sanitizeLocationName(String(address || ''));
    const numberSanitized = sanitizeLocationName(String(number || ''));
    const complementSanitized = sanitizeLocationName(String(complement || ''));
    const quadraTorreBlocoSanitized = sanitizeLocationName(String(quadra_torre_bloco || ''));
    const unidadeSanitized = sanitizeLocationName(String(unidade || ''));
    const andarSanitized = sanitizeLocationName(String(andar || ''));

    // Determine sale/rent
    const isVenda = objective === 'Vender' || objective === 'Alugar ou vender';
    const isLocacao = objective === 'Alugar' || objective === 'Alugar ou vender';

    // Build clean custom_fields (only fields that DON'T have a top-level column)
    const custom_fields_clean = {
      objetivo: objective,
      aceita_pets: acceptsPets,
      relacao_imovel: relationship,
      condominio: condoFeeNum,
      iptu: iptuNum,
      paga_iptu: hasIptu,
      // Supporting literal names for easier display
      uf: ufSigla || null,
      cidade: cidadeNome || null,
      bairro: bairroNome || null,
      tipo_imovel: type,
      finalidade: finalidade,
    };

    // Insert into produtos_servicos
    const insertResult = await query(`
      INSERT INTO produtos_servicos 
        (nome, preco_base, descricao, status, custom_fields, logradouro, numero, complemento, quadra_torre_bloco, unidade, andar, cep, pais_id, estado_id, cidade_id, bairro_id, user_id, dormitorio, suite, varanda, banheiro, vaga, areaservico, quartoservico, cozinha, lavabo, area_util, area_construida, area_terreno, imbtpoperacao_id, imbfinalidade_id, imbtpimovel_id, statusimovel, sala, dimensoes_terreno, latitude, longitude, plus_code, pub_site, pub_price, tipo, categoria, ativo, tags, organization_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 'produto', 'Imovel', true, '[]', '1')
      RETURNING id
    `, [
      title || `${type} - ${rooms} quartos`,
      precoBase,
      description || '',
      status || 'Pendente',
      JSON.stringify(custom_fields_clean),
      addressSanitized || null,
      numberSanitized || null,
      complementSanitized || null,
      quadraTorreBlocoSanitized || null,
      unidadeSanitized || null,
      andarSanitized || null,
      cep || null,
      resolvedLocation.paisId,
      resolvedLocation.estadoId,
      resolvedLocation.cidadeId,
      resolvedLocation.bairroId,
      userId,
      parseInt(rooms) || 0,
      parseInt(suites) || 0,
      parseInt(varandas) || 0,
      parseInt(bathrooms) || 0,
      parseInt(parking) || 0,
      parseInt(areaservico) || 0,
      parseInt(quartoservico) || 0,
      parseInt(cozinha) || 0,
      parseInt(lavabo) || 0,
      parseFloat(area) || 0,
      parseFloat(area_construida) || 0,
      parseFloat(area_terreno) || 0,
      imbtpoperacao_id || null,
      imbfinalidade_id || null,
      imbtpimovel_id || null,
      statusimovel || 2,
      parseInt(sala) || 0,
      dimensoes_terreno || null,
      latitude || null,
      longitude || null,
      plus_code || '',
      pub_site ?? true,
      pub_price ?? true
    ]);

    const produtoId = insertResult.rows[0].id;

    // Log the creation activity
    await recordAuditLog(produtoId, userId, 'CRIACAO', {
        title,
        status: status || 'Pendente'
    });

    return NextResponse.json({ success: true, id: produtoId });

  } catch (error: any) {
    console.error('Error submitting property:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar imóvel' }, { status: 500 });
  }
}
