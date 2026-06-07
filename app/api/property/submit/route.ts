import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
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
      pub_facebook, pub_instagram,
      latitude, longitude, plus_code,
      imbtpoperacao_id, imbfinalidade_id, imbtpimovel_id, statusimovel,
      empreendimento, imbtipoanuncio_id,
      pub_site, pub_price,
      // Rental-specific fields
      periodo_loca_id,
      condominio_incluso,
      iptu_incluso,
      seguro_incendio_incluso,
      seguro_incendio,
      // Boolean characteristics
      parque_aquatico, salao_festas, espaco_gourmet, espaco_zen, coworking, piquenique,
      espaco_grill, pet_park, supermarket, espaco_gamer, salao_jogos, sala_cinema, playground,
      sala_yoga, redario, horta, area_convivencia, espacos_gourmet_multiplos,
      academia, sala_funcional, quadra_poliesportiva, quadra_beach_tennis, campo_futebol_society,
      quadra_volei_praia, quadra_tenis, ciclovia, pista_cooper,
      controle_acesso_automatizado, sala_encomendas_delivery, wi_fi_areas_comuns
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
      const estadoRes = await query(
        `SELECT id, pais_id, sigla FROM public.apoestado WHERE ${fuzzyMatchSql('sigla', 1)}`,
        [ufSigla]
      );
      if (estadoRes.rows.length > 0) {
        resolvedEstadoId = Number(estadoRes.rows[0].id);
        resolvedPaisId = estadoRes.rows[0].pais_id ? Number(estadoRes.rows[0].pais_id) : null;

        // Auto-update master table if name is not standardized
        if (estadoRes.rows[0].sigla !== ufSigla) {
          console.log(`[DEBUG Location Submit] Standardizing Estado Sigla: ${estadoRes.rows[0].sigla} -> ${ufSigla}`);
          await query('UPDATE public.apoestado SET sigla = $1 WHERE id = $2', [ufSigla, resolvedEstadoId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Estado ID: ${resolvedEstadoId}`);
      } else {
        // Auto-create Estado
        console.log(`[DEBUG Location Submit] Creating Estado: ${ufSigla}`);
        const insertEstado = await query(
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
      const cidadeRes = await query(
        `SELECT id, descricao FROM public.apocidade WHERE estado_id = $1 AND ${fuzzyMatchSql('descricao', 2)}`,
        [resolvedEstadoId, cidadeNome]
      );
      if (cidadeRes.rows.length > 0) {
        resolvedCidadeId = Number(cidadeRes.rows[0].id);

        // Auto-update master table if name is not standardized
        if (cidadeRes.rows[0].descricao !== cidadeNome) {
          console.log(`[DEBUG Location Submit] Standardizing Cidade: ${cidadeRes.rows[0].descricao} -> ${cidadeNome}`);
          await query('UPDATE public.apocidade SET descricao = $1 WHERE id = $2', [cidadeNome, resolvedCidadeId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Cidade ID: ${resolvedCidadeId}`);
      } else {
        // Auto-create Cidade
        console.log(`[DEBUG Location Submit] Creating Cidade: ${cidadeNome}`);
        const insertCidade = await query(
          'INSERT INTO public.apocidade (descricao, estado_id, pais_id) VALUES ($1, $2, 1) RETURNING id',
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
      const bairroRes = await query(
        `SELECT id, descricao FROM public.apobairro WHERE cidade_id = $1 AND ${fuzzyMatchSql('descricao', 2)} AND estado_id = $3 LIMIT 1`,
        [resolvedCidadeId, bairroNome, resolvedEstadoId]
      );

      if (bairroRes.rows.length > 0) {
        resolvedBairroId = Number(bairroRes.rows[0].id);

        // Auto-update master table if name is not standardized
        if (bairroRes.rows[0].descricao !== bairroNome) {
          console.log(`[DEBUG Location Submit] Standardizing Bairro: ${bairroRes.rows[0].descricao} -> ${bairroNome}`);
          await query('UPDATE public.apobairro SET descricao = $1 WHERE id = $2', [bairroNome, resolvedBairroId]);
        }
        console.log(`[DEBUG Location Submit] Resolved Bairro ID: ${resolvedBairroId}`);
      } else {
        // Bairro resolution (Pure lookup)
        const bairroResBackup = await query(
          `SELECT id FROM public.apobairro WHERE cidade_id = $1 AND ${fuzzyMatchSql('descricao', 2)}`,
          [resolvedCidadeId, bairroNome]
        );
        if (bairroResBackup.rows.length > 0) {
          resolvedBairroId = Number(bairroResBackup.rows[0].id);
        } else if (resolvedEstadoId && cidadeNome) {
          // Final backup: search in ANY city with same name in same state
          const deepBairroRes = await query(
            `SELECT b.id FROM public.apobairro b 
             JOIN public.apocidade c ON b.cidade_id = c.id 
             WHERE c.estado_id = $1 AND ${fuzzyMatchSql('c.descricao', 2)} AND ${fuzzyMatchSql('b.descricao', 3)} 
             LIMIT 1`,
            [resolvedEstadoId, cidadeNome, bairroNome]
          );
          if (deepBairroRes.rows.length > 0) {
            resolvedBairroId = Number(deepBairroRes.rows[0].id);
          }
        }
        console.log(`[DEBUG Location Submit] Resolved Bairro ID (Fallback): ${resolvedBairroId}`);
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

    // Check if we need to trigger the bairro creation modal
    if (!resolvedLocation.bairroId && bairroNome && !autoCreateBairro) {
      return NextResponse.json({ 
        error: 'Bairro não encontrado', 
        needsBairroCreation: true,
        details: { 
            bairroNome, 
            cidadeNome, 
            ufSigla 
        }
      }, { status: 409 });
    }

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
      aceita_pets: acceptsPets,
      condominio: condoFeeNum,
      iptu: iptuNum,
      paga_iptu: hasIptu,
      pub_facebook: pub_facebook ?? true,
      pub_instagram: pub_instagram ?? true,
    };

    // Relationship ID mapping
    const relMapping: Record<string, number> = {
      'Proprietário': 1,
      'Corretor': 2,
      'Administrador/Outro': 3
    };
    const relimovel_id = relMapping[relationship] || 3;
    const prop_id = relationship === 'Proprietário' ? userId : null;

    // Insert into public.produto_servico
    const insertResult = await query(`
      INSERT INTO public.produto_servico 
        (nome, descricao, status, logradouro, numero, complemento, quadra_torre_bloco, unidade, andar, cep, pais_id, estado_id, cidade_id, bairro_id, user_id, prop_id, imbtpoperacao_id, statusimovel, imbempreendimento_id, latitude, longitude, plus_code, pub_site, pub_price, pub_facebook, pub_instagram, relimovel_id, imbtipoanuncio_id, tipo, categoria, ativo, tags, organization_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 'produto', 'Imovel', true, '[]', '1')
      RETURNING id
    `, [
      title || `${type} - ${rooms} quartos`,
      description || '',
      status || 'Pendente',
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
      prop_id,
      imbtpoperacao_id || null,
      statusimovel || 2,
      empreendimento || null,
      latitude || null,
      longitude || null,
      plus_code || '',
      pub_site ?? true,
      pub_price ?? true,
      pub_facebook ?? true,
      pub_instagram ?? true,
      relimovel_id,
      imbtipoanuncio_id || 1
    ]);

    const produtoId = insertResult.rows[0].id;

    // Insert into public.produto_servico_carac
    await query(`
      INSERT INTO public.produto_servico_carac (
        produto_servico_id,
        dormitorio, suite, varanda, banheiro, vaga, areaservico, quartoservico, cozinha, lavabo, sala,
        area_util, area_construida, area_terreno, dimensoes_terreno,
        parque_aquatico, salao_festas, espaco_gourmet, espaco_zen, coworking, piquenique, espaco_grill,
        pet_park, supermarket, espaco_gamer, salao_jogos, sala_cinema, playground,
        sala_yoga, redario, horta, area_convivencia, espacos_gourmet_multiplos,
        academia, sala_funcional, quadra_poliesportiva, quadra_beach_tennis, campo_futebol_society,
        quadra_volei_praia, quadra_tenis, ciclovia, pista_cooper,
        controle_acesso_automatizado, sala_encomendas_delivery, wi_fi_areas_comuns,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42,
        $43, $44, $45, $46, $47
      )
    `, [
      produtoId,
      parseInt(rooms) || 0,
      parseInt(suites) || 0,
      parseInt(varandas) || 0,
      parseInt(bathrooms) || 0,
      parseInt(parking) || 0,
      parseInt(areaservico) || 0,
      parseInt(quartoservico) || 0,
      parseInt(cozinha) || 0,
      parseInt(lavabo) || 0,
      parseInt(sala) || 0,
      parseFloat(area) || 0,
      parseFloat(area_construida) || 0,
      parseFloat(area_terreno) || 0,
      dimensoes_terreno || null,
      parque_aquatico === true || parque_aquatico === 'true',
      salao_festas === true || salao_festas === 'true',
      parseInt(espaco_gourmet) || 0,
      espaco_zen === true || espaco_zen === 'true',
      coworking === true || coworking === 'true',
      piquenique === true || piquenique === 'true',
      espaco_grill === true || espaco_grill === 'true',
      pet_park === true || pet_park === 'true',
      supermarket === true || supermarket === 'true',
      espaco_gamer === true || espaco_gamer === 'true',
      salao_jogos === true || salao_jogos === 'true',
      sala_cinema === true || sala_cinema === 'true',
      playground === true || playground === 'true',
      sala_yoga === true || sala_yoga === 'true',
      redario === true || redario === 'true',
      horta === true || horta === 'true',
      area_convivencia === true || area_convivencia === 'true',
      espacos_gourmet_multiplos === true || espacos_gourmet_multiplos === 'true',
      academia === true || academia === 'true',
      sala_funcional === true || sala_funcional === 'true',
      quadra_poliesportiva === true || quadra_poliesportiva === 'true',
      quadra_beach_tennis === true || quadra_beach_tennis === 'true',
      campo_futebol_society === true || campo_futebol_society === 'true',
      quadra_volei_praia === true || quadra_volei_praia === 'true',
      quadra_tenis === true || quadra_tenis === 'true',
      ciclovia === true || ciclovia === 'true',
      pista_cooper === true || pista_cooper === 'true',
      controle_acesso_automatizado === true || controle_acesso_automatizado === 'true',
      sala_encomendas_delivery === true || sala_encomendas_delivery === 'true',
      wi_fi_areas_comuns === true || wi_fi_areas_comuns === 'true',
      userId,
      userId
    ]);

    // Se a operação for locação, salvar na tabela acessória public.produto_servicos_loca
    if (imbtpoperacao_id === 2) {
      const prCondominio = parsePriceBR(condoFee);
      const prIptuanual = parsePriceBR(iptuValue);
      const prSegincendio = parsePriceBR(seguro_incendio);
      
      const isCondominioIncluso = condominio_incluso === true;
      const isIptuIncluso = iptu_incluso === true;
      const isSeguroIncendioIncluso = seguro_incendio_incluso === true;

      const inclusocond = isCondominioIncluso ? '0' : '1';
      const inclusoiptu = isIptuIncluso ? '0' : '1';
      const inclusoincendio = isSeguroIncendioIncluso ? '0' : '1';

      const vrtotal = precoBase + 
        (isCondominioIncluso ? 0 : prCondominio) + 
        (isIptuIncluso ? 0 : (prIptuanual / 12)) + 
        (isSeguroIncendioIncluso ? 0 : prSegincendio);

      const resolvedPeriodoLocaId = Number(periodo_loca_id) || 3; // Padrão: Mensal

      await query(`
        INSERT INTO public.produto_servicos_loca (
          produto_servico_id, periodo_loca_id, imbfinalidade_id, imbtpimovel_id, preco_base,
          inclusocond, pr_condominio, inclusoiptu, pr_iptuanual, inclusoincendio, pr_segincendio,
          vrtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        produtoId,
        resolvedPeriodoLocaId,
        imbfinalidade_id || null,
        imbtpimovel_id || null,
        precoBase,
        inclusocond,
        prCondominio,
        inclusoiptu,
        prIptuanual,
        inclusoincendio,
        prSegincendio,
        vrtotal
      ]);
    }

    // Se a operação for venda, salvar na tabela acessória public.produto_servicos_venda
    if (imbtpoperacao_id === 1) {
      const prCondominio = parsePriceBR(condoFee);
      const prIptuanual = parsePriceBR(iptuValue);
      const prSegincendio = parsePriceBR(seguro_incendio);
      const vrtotal = precoBase;

      await query(`
        INSERT INTO public.produto_servicos_venda (
          produto_servico_id, imbfinalidade_id, imbtpimovel_id, preco_base,
          pr_condominio, pr_iptuanual, pr_segincendio, vrtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        produtoId,
        imbfinalidade_id || null,
        imbtpimovel_id || null,
        precoBase,
        prCondominio,
        prIptuanual,
        prSegincendio,
        vrtotal
      ]);
    }

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
