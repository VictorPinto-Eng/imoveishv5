import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { sanitizeLocationName } from '@/lib/sanitize-location';
import { JWT_SECRET } from '@/lib/auth-config';
import { recordAuditLog } from '@/lib/analytics-service';

// GET: Fetch property details for editing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const userId = decoded.id;

    const res = await query(`
      SELECT 
        p.*,
        carac.dormitorio, carac.suite, carac.varanda, carac.banheiro, carac.vaga, carac.areaservico, carac.quartoservico, carac.cozinha, carac.lavabo, carac.area_util, carac.area_construida, carac.area_terreno, carac.dimensoes_terreno, carac.sala, carac.parque_aquatico, carac.salao_festas, carac.espaco_gourmet, carac.espaco_zen, carac.coworking, carac.piquenique, carac.espaco_grill, carac.pet_park, carac.supermarket, carac.espaco_gamer, carac.salao_jogos, carac.sala_cinema, carac.playground, carac.sala_yoga, carac.redario, carac.horta, carac.area_convivencia, carac.espacos_gourmet_multiplos, carac.academia, carac.sala_funcional, carac.quadra_poliesportiva, carac.quadra_beach_tennis, carac.campo_futebol_society, carac.quadra_volei_praia, carac.quadra_tenis, carac.ciclovia, carac.pista_cooper, carac.controle_acesso_automatizado, carac.sala_encomendas_delivery, carac.wi_fi_areas_comuns,
        tp.descricao as tipo_nome,
        op.descricao as operacao_nome,
        est.sigla as uf_nome,
        cid.descricao as cidade_nome,
        bai.descricao as bairro_nome,
        pl.periodo_loca_id,
        pl.imbfinalidade_id as loc_imbfinalidade_id,
        pl.imbtpimovel_id as loc_imbtpimovel_id,
        pl.inclusocond,
        pl.pr_condominio as loc_pr_condominio,
        pl.inclusoiptu,
        pl.pr_iptuanual as loc_pr_iptuanual,
        pl.inclusoincendio,
        pl.pr_segincendio as loc_pr_segincendio,
        pl.vrtotal as loc_vrtotal,
        pl.preco_base as loc_preco_base,
        pv.imbfinalidade_id as venda_imbfinalidade_id,
        pv.imbtpimovel_id as venda_imbtpimovel_id,
        pv.pr_condominio as venda_pr_condominio,
        pv.pr_iptuanual as venda_pr_iptuanual,
        pv.pr_segincendio as venda_pr_segincendio,
        pv.vrtotal as venda_vrtotal,
        pv.preco_base as venda_preco_base
      FROM public.produto_servico p
      LEFT JOIN public.produto_servico_carac carac ON p.id = carac.produto_servico_id
      LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
      LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
      LEFT JOIN imbtpimovel tp ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = tp.id
      LEFT JOIN imbtpoperacao op ON p.imbtpoperacao_id = op.id
      LEFT JOIN apoestado est ON p.estado_id = est.id
      LEFT JOIN apocidade cid ON p.cidade_id = cid.id
      LEFT JOIN apobairro bai ON p.bairro_id = bai.id
      WHERE p.id = $1 AND p.user_id = $2
    `, [id, userId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão' }, { status: 404 });
    }

    // Fetch photos from new media table
    const photosRes = await query(
      'SELECT * FROM public.produtos_servicos_midia WHERE produto_servico_id = $1 ORDER BY ordem_exibicao ASC, id ASC',
      [id]
    );
    let photosList = photosRes.rows;
    if (photosList.length === 0 && res.rows[0]?.imbempreendimento_id) {
      const empPhotosRes = await query(
        'SELECT * FROM public.imbempreendimento_midia WHERE imbempreendimento_id = $1 ORDER BY ordem_exibicao ASC, id ASC',
        [res.rows[0].imbempreendimento_id]
      );
      photosList = empPhotosRes.rows;
    }

    // Map relimovel_id back to relationship string for frontend
    const relMapping: Record<number, string> = {
        1: 'Proprietário',
        2: 'Corretor',
        3: 'Administrador/Outro'
    };
    const relationship = relMapping[res.rows[0].relimovel_id] || 'Administrador/Outro';

    const row = res.rows[0];
    const pub_facebook = row.custom_fields?.pub_facebook ?? true;
    const pub_instagram = row.custom_fields?.pub_instagram ?? true;

    // Mapeamento dos valores de locação ou venda das tabelas acessórias
    const hasLocacao = row.loc_preco_base !== null && row.loc_preco_base !== undefined;
    const hasVenda = row.venda_preco_base !== null && row.venda_preco_base !== undefined;
    
    let preco_base = 0;
    let imbfinalidade_id = null;
    let imbtpimovel_id = null;
    let condominio_incluso = false;
    let iptu_incluso = false;
    let seguro_incendio_incluso = false;
    let seguro_incendio = 0;
    let vrtotal = 0;
    
    const customFields = { ...(row.custom_fields || {}) };
    
    if (hasLocacao) {
      preco_base = Number(row.loc_preco_base);
      if (row.loc_imbfinalidade_id !== null && row.loc_imbfinalidade_id !== undefined) {
        imbfinalidade_id = Number(row.loc_imbfinalidade_id);
      }
      if (row.loc_imbtpimovel_id !== null && row.loc_imbtpimovel_id !== undefined) {
        imbtpimovel_id = Number(row.loc_imbtpimovel_id);
      }
      condominio_incluso = row.inclusocond !== null ? (row.inclusocond === '0' || row.inclusocond === 0 || row.inclusocond.toString() === '0') : false;
      iptu_incluso = row.inclusoiptu !== null ? (row.inclusoiptu === '0' || row.inclusoiptu === 0 || row.inclusoiptu.toString() === '0') : false;
      seguro_incendio_incluso = row.inclusoincendio !== null ? (row.inclusoincendio === '0' || row.inclusoincendio === 0 || row.inclusoincendio.toString() === '0') : false;
      seguro_incendio = row.loc_pr_segincendio !== null ? Number(row.loc_pr_segincendio) : 0;
      vrtotal = row.loc_vrtotal !== null ? Number(row.loc_vrtotal) : preco_base;
      
      customFields.condominio = row.loc_pr_condominio !== null ? Number(row.loc_pr_condominio) : 0;
      customFields.iptu = row.loc_pr_iptuanual !== null ? Number(row.loc_pr_iptuanual) : 0;
    } else if (hasVenda) {
      preco_base = Number(row.venda_preco_base);
      if (row.venda_imbfinalidade_id !== null && row.venda_imbfinalidade_id !== undefined) {
        imbfinalidade_id = Number(row.venda_imbfinalidade_id);
      }
      if (row.venda_imbtpimovel_id !== null && row.venda_imbtpimovel_id !== undefined) {
        imbtpimovel_id = Number(row.venda_imbtpimovel_id);
      }
      condominio_incluso = false;
      iptu_incluso = false;
      seguro_incendio_incluso = false;
      seguro_incendio = row.venda_pr_segincendio !== null ? Number(row.venda_pr_segincendio) : 0;
      vrtotal = row.venda_vrtotal !== null ? Number(row.venda_vrtotal) : preco_base;

      customFields.condominio = row.venda_pr_condominio !== null ? Number(row.venda_pr_condominio) : 0;
      customFields.iptu = row.venda_pr_iptuanual !== null ? Number(row.venda_pr_iptuanual) : 0;
    } else if (row.imbtpoperacao_id === 2) {
      // Se for locação mas sem registro na tabela acessória, iniciar zerado
      preco_base = 0;
      imbfinalidade_id = null;
      imbtpimovel_id = null;
      condominio_incluso = false;
      iptu_incluso = false;
      seguro_incendio_incluso = false;
      seguro_incendio = 0;
      vrtotal = 0;
      
      customFields.condominio = 0;
      customFields.iptu = 0;
    } else {
      preco_base = 0;
      imbfinalidade_id = null;
      imbtpimovel_id = null;
      condominio_incluso = false;
      iptu_incluso = false;
      seguro_incendio_incluso = false;
      seguro_incendio = 0;
      vrtotal = 0;
      
      customFields.condominio = 0;
      customFields.iptu = 0;
    }

    return NextResponse.json({ 
        success: true, 
        imovel: {
            ...row,
            preco_base,
            imbfinalidade_id,
            imbtpimovel_id,
            custom_fields: customFields,
            relationship,
            pub_facebook,
            pub_instagram,
            imbtipoanuncio_id: row.imbtipoanuncio_id !== null ? Number(row.imbtipoanuncio_id) : 1,
            // Map singular DB to plural JSON for frontend compatibility
            dormitorios: row.dormitorio,
            suites: row.suite,
            varandas: row.varanda,
            banheiros: row.banheiro,
            vagas: row.vaga,
            latitude: row.latitude || null,
            longitude: row.longitude || null,
            plus_code: row.plus_code || '',
            pub_site: row.pub_site,
            pub_price: row.pub_price,
            empreendimento: row.imbempreendimento_id,
            seguro_incendio,
            condominio_incluso,
            iptu_incluso,
            seguro_incendio_incluso,
            vrtotal: row.imbtpoperacao_id === 2 ? vrtotal : null,
            periodo_loca_id: hasLocacao ? row.periodo_loca_id : (row.imbtpoperacao_id === 2 ? 3 : null),
            photos: photosList
        } 
    });

  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados do imóvel' }, { status: 500 });
  }
}

// PUT: Update property details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const userId = decoded.id;

    // 0. Fetch OLD data for diffing and partial update fallback
    const oldRes = await query(
      `SELECT p.*, carac.* 
       FROM public.produto_servico p
       LEFT JOIN public.produto_servico_carac carac ON p.id = carac.produto_servico_id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, userId]
    );
    const oldData = oldRes.rows[0];
    if (!oldData) {
        return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    // Buscar dados antigos de locação na tabela acessória, se existirem
    const oldLocRes = await query(
      'SELECT * FROM public.produto_servicos_loca WHERE produto_servico_id = $1',
      [id]
    );
    const oldLocData = oldLocRes.rows[0] || {};

    // Buscar dados antigos de venda na tabela acessória, se existirem
    const oldVendaRes = await query(
      'SELECT * FROM public.produto_servicos_venda WHERE produto_servico_id = $1',
      [id]
    );
    const oldVendaData = oldVendaRes.rows[0] || {};

    const body = await req.json();
    
    // Fallbacks para campos removidos da tabela principal
    const oldPrecoBase = oldLocData.preco_base !== undefined ? oldLocData.preco_base : (oldVendaData.preco_base !== undefined ? oldVendaData.preco_base : 0);
    const oldImbfinalidadeId = oldLocData.imbfinalidade_id !== undefined ? oldLocData.imbfinalidade_id : (oldVendaData.imbfinalidade_id !== undefined ? oldVendaData.imbfinalidade_id : null);
    const oldImbtpimovelId = oldLocData.imbtpimovel_id !== undefined ? oldLocData.imbtpimovel_id : (oldVendaData.imbtpimovel_id !== undefined ? oldVendaData.imbtpimovel_id : null);

    // Partial update support: merge body with oldData
    const title = body.title !== undefined ? body.title : (body.nome !== undefined ? body.nome : oldData.nome);
    const description = body.description !== undefined ? body.description : (body.descricao !== undefined ? body.descricao : oldData.descricao);
    const price = body.price !== undefined ? body.price : (body.preco_base !== undefined ? body.preco_base : oldPrecoBase);
    const status = body.status !== undefined ? body.status : oldData.status;
    const custom_fields_req = body.custom_fields !== undefined ? body.custom_fields : oldData.custom_fields;
    
    // Geographical fields
    const logradouro = body.logradouro !== undefined ? body.logradouro : oldData.logradouro;
    const numero = body.numero !== undefined ? body.numero : oldData.numero;
    const complemento = body.complemento !== undefined ? body.complemento : oldData.complemento;
    const quadra_torre_bloco = body.quadra_torre_bloco !== undefined ? body.quadra_torre_bloco : oldData.quadra_torre_bloco;
    const unidade = body.unidade !== undefined ? body.unidade : oldData.unidade;
    const andar = body.andar !== undefined ? body.andar : oldData.andar;
    const cep = body.cep !== undefined ? body.cep : oldData.cep;
    
    const pais_id = body.pais_id !== undefined ? body.pais_id : oldData.pais_id;
    const estado_id = body.estado_id !== undefined ? body.estado_id : oldData.estado_id;
    const cidade_id = body.cidade_id !== undefined ? body.cidade_id : oldData.cidade_id;
    const bairro_id = body.bairro_id !== undefined ? body.bairro_id : oldData.bairro_id;

    // Characteristics
    const dormitorio = body.dormitorio !== undefined ? body.dormitorio : oldData.dormitorio;
    const suite = body.suite !== undefined ? body.suite : oldData.suite;
    const varanda = body.varanda !== undefined ? body.varanda : oldData.varanda;
    const banheiro = body.banheiro !== undefined ? body.banheiro : oldData.banheiro;
    const vaga = body.vaga !== undefined ? body.vaga : oldData.vaga;
    const areaservico = body.areaservico !== undefined ? body.areaservico : oldData.areaservico;
    const quartoservico = body.quartoservico !== undefined ? body.quartoservico : oldData.quartoservico;
    const cozinha = body.cozinha !== undefined ? body.cozinha : oldData.cozinha;
    const lavabo = body.lavabo !== undefined ? body.lavabo : oldData.lavabo;
    const sala = body.sala !== undefined ? body.sala : oldData.sala;
    
    const area_util = body.area_util !== undefined ? body.area_util : oldData.area_util;
    const area_construida = body.area_construida !== undefined ? body.area_construida : oldData.area_construida;
    const area_terreno = body.area_terreno !== undefined ? body.area_terreno : oldData.area_terreno;
    const dimensoes_terreno = body.dimensoes_terreno !== undefined ? body.dimensoes_terreno : oldData.dimensoes_terreno;
    
    const empreendimento = body.empreendimento !== undefined ? body.empreendimento : oldData.imbempreendimento_id;
    const pub_site = body.pub_site !== undefined ? body.pub_site : oldData.pub_site;
    const pub_price = body.pub_price !== undefined ? body.pub_price : oldData.pub_price;
    
    const latitude = body.latitude !== undefined ? body.latitude : oldData.latitude;
    const longitude = body.longitude !== undefined ? body.longitude : oldData.longitude;
    const plus_code = body.plus_code !== undefined ? body.plus_code : oldData.plus_code;
    
    const imbtpoperacao_id = body.imbtpoperacao_id !== undefined ? body.imbtpoperacao_id : oldData.imbtpoperacao_id;
    const imbfinalidade_id = body.imbfinalidade_id !== undefined ? body.imbfinalidade_id : oldImbfinalidadeId;
    const imbtpimovel_id = body.imbtpimovel_id !== undefined ? body.imbtpimovel_id : oldImbtpimovelId;
    const statusimovel = body.statusimovel !== undefined ? body.statusimovel : oldData.statusimovel;
    const imbtipoanuncio_id = body.imbtipoanuncio_id !== undefined ? body.imbtipoanuncio_id : oldData.imbtipoanuncio_id;
    
    const seguro_incendio = body.seguro_incendio !== undefined 
        ? body.seguro_incendio 
        : (oldLocData.pr_segincendio !== undefined 
            ? oldLocData.pr_segincendio 
            : oldData.seguro_incendio);

    const condominio_incluso = body.condominio_incluso !== undefined 
        ? body.condominio_incluso 
        : (oldLocData.inclusocond !== undefined 
            ? (oldLocData.inclusocond === '0' || oldLocData.inclusocond === 0)
            : (oldData.condominio_incluso || false));
            
    const iptu_incluso = body.iptu_incluso !== undefined 
        ? body.iptu_incluso 
        : (oldLocData.inclusoiptu !== undefined 
            ? (oldLocData.inclusoiptu === '0' || oldLocData.inclusoiptu === 0)
            : (oldData.iptu_incluso || false));
            
    const seguro_incendio_incluso = body.seguro_incendio_incluso !== undefined 
        ? body.seguro_incendio_incluso 
        : (oldLocData.inclusoincendio !== undefined 
            ? (oldLocData.inclusoincendio === '0' || oldLocData.inclusoincendio === 0)
            : (oldData.seguro_incendio_incluso || false));

    const periodo_loca_id = body.periodo_loca_id !== undefined 
        ? body.periodo_loca_id 
        : (oldLocData.periodo_loca_id !== undefined 
            ? oldLocData.periodo_loca_id 
            : null);

    // Relationship ID mapping
    const relMapping: Record<string, number> = {
      'Proprietário': 1,
      'Corretor': 2,
      'Administrador/Outro': 3
    };
    
    let relimovel_id = oldData.relimovel_id;
    let prop_id = oldData.prop_id;
    if (body.relationship !== undefined) {
      relimovel_id = relMapping[body.relationship] || 3;
      prop_id = body.relationship === 'Proprietário' ? userId : null;
    }

    const ufRaw = custom_fields_req?.uf || '';
    const cidadeRaw = custom_fields_req?.cidade || '';
    const bairroRaw = custom_fields_req?.bairro || '';

    const ufSigla = sanitizeLocationName(String(ufRaw));
    const cidadeNome = sanitizeLocationName(String(cidadeRaw));
    const bairroNome = sanitizeLocationName(String(bairroRaw));

    const resolveLocationIds = async () => {
      let resolvedPaisId = Number(pais_id) || null;
      let resolvedEstadoId = Number(estado_id) || null;
      let resolvedCidadeId = Number(cidade_id) || null;
      let resolvedBairroId = Number(bairro_id) || null;

      console.log(`[DEBUG Location] Input IDs: EF=${resolvedEstadoId}, CID=${resolvedCidadeId}, BAI=${resolvedBairroId}`);
      console.log(`[DEBUG Location] Input Names: UF=${ufSigla}, CID=${cidadeNome}, BAI=${bairroNome}`);

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
        resolvedPaisId = estadoRes.rows[0].pais_id ? Number(estadoRes.rows[0].pais_id) : resolvedPaisId;
        
        // Auto-update master table if name is not standardized
        if (estadoRes.rows[0].sigla !== ufSigla) {
          console.log(`[DEBUG Location] Standardizing Estado Sigla: ${estadoRes.rows[0].sigla} -> ${ufSigla}`);
          await query('UPDATE public.apoestado SET sigla = $1 WHERE id = $2', [ufSigla, resolvedEstadoId]);
        }
        console.log(`[DEBUG Location] Resolved Estado ID: ${resolvedEstadoId}`);
      } else {
        // Create Estado if not found (fallback)
        console.log(`[DEBUG Location] Creating Estado: ${ufSigla}`);
        const insertEstado = await query(
          'INSERT INTO public.apoestado (nome, sigla, pais_id) VALUES ($1, $2, $3) RETURNING id',
          [ufSigla, ufSigla, resolvedPaisId || 1]
        );
        if (insertEstado.rows.length > 0) {
          resolvedEstadoId = Number(insertEstado.rows[0].id);
          console.log(`[DEBUG Location] Created Estado ID: ${resolvedEstadoId}`);
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
          console.log(`[DEBUG Location] Standardizing Cidade: ${cidadeRes.rows[0].descricao} -> ${cidadeNome}`);
          await query('UPDATE public.apocidade SET descricao = $1 WHERE id = $2', [cidadeNome, resolvedCidadeId]);
        }
        console.log(`[DEBUG Location] Resolved Cidade ID: ${resolvedCidadeId}`);
      } else {
        // Auto-create Cidade
        console.log(`[DEBUG Location] Creating Cidade: ${cidadeNome}`);
        const insertCidade = await query(
          'INSERT INTO public.apocidade (descricao, estado_id, pais_id) VALUES ($1, $2, 1) RETURNING id',
          [cidadeNome, resolvedEstadoId]
        );
        if (insertCidade.rows.length > 0) {
          resolvedCidadeId = Number(insertCidade.rows[0].id);
          console.log(`[DEBUG Location] Created Cidade ID: ${resolvedCidadeId}`);
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
          console.log(`[DEBUG Location] Standardizing Bairro: ${bairroRes.rows[0].descricao} -> ${bairroNome}`);
          await query('UPDATE public.apobairro SET descricao = $1 WHERE id = $2', [bairroNome, resolvedBairroId]);
        }
        console.log(`[DEBUG Location] Resolved Bairro ID: ${resolvedBairroId}`);
      } else {
        // Bairro resolution (Pure lookup)
        const bairroRes = await query(
          `SELECT id FROM public.apobairro WHERE cidade_id = $1 AND ${fuzzyMatchSql('descricao', 2)}`,
          [resolvedCidadeId, bairroNome]
        );
        if (bairroRes.rows.length > 0) {
          resolvedBairroId = Number(bairroRes.rows[0].id);
        }
        console.log(`[DEBUG Location] Resolved Bairro ID: ${resolvedBairroId}`);
      }
    }

    return {
      paisId: resolvedPaisId,
      estadoId: resolvedEstadoId,
      cidadeId: resolvedCidadeId,
      bairroId: resolvedBairroId,
    };
  };

  // Parse price if it's a string from UI
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
  const resolvedLocation = await resolveLocationIds();
  
  // Sanitization of Address fields (Uppercase + Accents removal)
  const logradouroSanitized = sanitizeLocationName(String(logradouro || ''));
  const numeroSanitized = sanitizeLocationName(String(numero || ''));
  const complementoSanitized = sanitizeLocationName(String(complemento || ''));
  const quadraTorreBlocoSanitized = sanitizeLocationName(String(quadra_torre_bloco || ''));
  const unidadeSanitized = sanitizeLocationName(String(unidade || ''));
  const andarSanitized = sanitizeLocationName(String(andar || ''));

    // Build clean custom_fields (only fields that DON'T have a top-level column)
    const normalizedCustomFields = {
      ...(custom_fields_req || {}),
    };

    // Remove fields that already have columns
    const columnsWithDedicatedStorage = [
      'dormitorio', 'suite', 'varanda', 'banheiro', 'vaga',
      'areaservico', 'quartoservico', 'cozinha', 'lavabo', 'sala', 'dimensoes_terreno',
      'area_util', 'area_construida', 'area_terreno',
      'logradouro', 'numero', 'complemento', 'quadra_torre_bloco', 'unidade', 'andar', 'cep',
      'pais_id', 'estado_id', 'cidade_id', 'bairro_id',
      'imbtpoperacao_id', 'imbfinalidade_id', 'imbtpimovel_id', 'statusimovel',
      'status', 'area_total', 'latitude', 'longitude', 'plus_code',
      'pub_site', 'pub_price', 'relimovel_id', 'prop_id',
      'seguro_incendio', 'condominio_incluso', 'iptu_incluso', 'seguro_incendio_incluso'
    ];

    columnsWithDedicatedStorage.forEach(key => delete normalizedCustomFields[key]);

    const pubFacebookVal = body.pub_facebook !== undefined ? body.pub_facebook : (oldData.pub_facebook ?? true);
    const pubInstagramVal = body.pub_instagram !== undefined ? body.pub_instagram : (oldData.pub_instagram ?? true);

    const condoFeeVal = body.custom_fields?.condominio !== undefined 
      ? body.custom_fields.condominio 
      : (oldLocData.pr_condominio !== undefined ? oldLocData.pr_condominio : (oldVendaData.pr_condominio !== undefined ? oldVendaData.pr_condominio : 0));
      
    const iptuValueVal = body.custom_fields?.iptu !== undefined 
      ? body.custom_fields.iptu 
      : (oldLocData.pr_iptuanual !== undefined ? oldLocData.pr_iptuanual : (oldVendaData.pr_iptuanual !== undefined ? oldVendaData.pr_iptuanual : 0));

    // Update query
    const updateRes = await query(`
      UPDATE public.produto_servico 
      SET 
        nome = $1, 
        descricao = $2, 
        status = $3,
        logradouro = $4,
        numero = $5,
        complemento = $6,
        quadra_torre_bloco = $7,
        unidade = $8,
        andar = $9,
        cep = $10,
        pais_id = $11,
        estado_id = $12,
        cidade_id = $13,
        bairro_id = $14,
        imbtpoperacao_id = $15,
        imbempreendimento_id = $16,
        statusimovel = $17,
        latitude = $18,
        longitude = $19,
        plus_code = $20,
        pub_site = $21,
        pub_price = $22,
        pub_facebook = $23,
        pub_instagram = $24,
        relimovel_id = $25,
        prop_id = $26,
        imbtipoanuncio_id = $30,
        updated_at = NOW(),
        updated_by = $27,
        organization_id = COALESCE(organization_id, '1')
      WHERE id = $28 AND user_id = $29
      RETURNING id
    `, [
      title || oldData.nome || 'Imóvel sem título', 
      description || '', 
      status || 'ativo',
      logradouroSanitized || null,
      numeroSanitized || null,
      complementoSanitized || null,
      quadraTorreBlocoSanitized || null,
      unidadeSanitized || null,
      andarSanitized || null,
      cep || null,
      resolvedLocation.paisId,
      resolvedLocation.estadoId,
      resolvedLocation.cidadeId,
      resolvedLocation.bairroId,
      imbtpoperacao_id || null,
      empreendimento || null,
      statusimovel || null,
      latitude || null,
      longitude || null,
      plus_code || '',
      pub_site ?? true,
      pub_price ?? true,
      pubFacebookVal,
      pubInstagramVal,
      relimovel_id,
      prop_id,
      userId,
      id,
      userId,
      imbtipoanuncio_id || 1
    ]);

  if (updateRes.rowCount === 0) {
    return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão para editar' }, { status: 404 });
  }

  // Parse characteristics booleans
  const parseBool = (val: any) => val === true || val === 'true';

  const parque_aquatico = body.parque_aquatico !== undefined ? parseBool(body.parque_aquatico) : parseBool(oldData.parque_aquatico);
  const salao_festas = body.salao_festas !== undefined ? parseBool(body.salao_festas) : parseBool(oldData.salao_festas);
  const espaco_gourmet = body.espaco_gourmet !== undefined ? (parseInt(body.espaco_gourmet) || 0) : (parseInt(oldData.espaco_gourmet) || 0);
  const espaco_zen = body.espaco_zen !== undefined ? parseBool(body.espaco_zen) : parseBool(oldData.espaco_zen);
  const coworking = body.coworking !== undefined ? parseBool(body.coworking) : parseBool(oldData.coworking);
  const piquenique = body.piquenique !== undefined ? parseBool(body.piquenique) : parseBool(oldData.piquenique);
  const espaco_grill = body.espaco_grill !== undefined ? parseBool(body.espaco_grill) : parseBool(oldData.espaco_grill);
  const pet_park = body.pet_park !== undefined ? parseBool(body.pet_park) : parseBool(oldData.pet_park);
  const supermarket = body.supermarket !== undefined ? parseBool(body.supermarket) : parseBool(oldData.supermarket);
  const espaco_gamer = body.espaco_gamer !== undefined ? parseBool(body.espaco_gamer) : parseBool(oldData.espaco_gamer);
  const salao_jogos = body.salao_jogos !== undefined ? parseBool(body.salao_jogos) : parseBool(oldData.salao_jogos);
  const sala_cinema = body.sala_cinema !== undefined ? parseBool(body.sala_cinema) : parseBool(oldData.sala_cinema);
  const playground = body.playground !== undefined ? parseBool(body.playground) : parseBool(oldData.playground);

  const sala_yoga = body.sala_yoga !== undefined ? parseBool(body.sala_yoga) : parseBool(oldData.sala_yoga);
  const redario = body.redario !== undefined ? parseBool(body.redario) : parseBool(oldData.redario);
  const horta = body.horta !== undefined ? parseBool(body.horta) : parseBool(oldData.horta);
  const area_convivencia = body.area_convivencia !== undefined ? parseBool(body.area_convivencia) : parseBool(oldData.area_convivencia);
  const espacos_gourmet_multiplos = body.espacos_gourmet_multiplos !== undefined ? parseBool(body.espacos_gourmet_multiplos) : parseBool(oldData.espacos_gourmet_multiplos);

  const academia = body.academia !== undefined ? parseBool(body.academia) : parseBool(oldData.academia);
  const sala_funcional = body.sala_funcional !== undefined ? parseBool(body.sala_funcional) : parseBool(oldData.sala_funcional);
  const quadra_poliesportiva = body.quadra_poliesportiva !== undefined ? parseBool(body.quadra_poliesportiva) : parseBool(oldData.quadra_poliesportiva);
  const quadra_beach_tennis = body.quadra_beach_tennis !== undefined ? parseBool(body.quadra_beach_tennis) : parseBool(oldData.quadra_beach_tennis);
  const campo_futebol_society = body.campo_futebol_society !== undefined ? parseBool(body.campo_futebol_society) : parseBool(oldData.campo_futebol_society);
  const quadra_volei_praia = body.quadra_volei_praia !== undefined ? parseBool(body.quadra_volei_praia) : parseBool(oldData.quadra_volei_praia);
  const quadra_tenis = body.quadra_tenis !== undefined ? parseBool(body.quadra_tenis) : parseBool(oldData.quadra_tenis);
  const ciclovia = body.ciclovia !== undefined ? parseBool(body.ciclovia) : parseBool(oldData.ciclovia);
  const pista_cooper = body.pista_cooper !== undefined ? parseBool(body.pista_cooper) : parseBool(oldData.pista_cooper);

  const controle_acesso_automatizado = body.controle_acesso_automatizado !== undefined ? parseBool(body.controle_acesso_automatizado) : parseBool(oldData.controle_acesso_automatizado);
  const sala_encomendas_delivery = body.sala_encomendas_delivery !== undefined ? parseBool(body.sala_encomendas_delivery) : parseBool(oldData.sala_encomendas_delivery);
  const wi_fi_areas_comuns = body.wi_fi_areas_comuns !== undefined ? parseBool(body.wi_fi_areas_comuns) : parseBool(oldData.wi_fi_areas_comuns);

  // Update public.produto_servico_carac
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
      created_by, updated_by, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
      $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42,
      $43, $44, $45, $46, $46, NOW()
    )
    ON CONFLICT (produto_servico_id) DO UPDATE SET
      dormitorio = EXCLUDED.dormitorio,
      suite = EXCLUDED.suite,
      varanda = EXCLUDED.varanda,
      banheiro = EXCLUDED.banheiro,
      vaga = EXCLUDED.vaga,
      areaservico = EXCLUDED.areaservico,
      quartoservico = EXCLUDED.quartoservico,
      cozinha = EXCLUDED.cozinha,
      lavabo = EXCLUDED.lavabo,
      sala = EXCLUDED.sala,
      area_util = EXCLUDED.area_util,
      area_construida = EXCLUDED.area_construida,
      area_terreno = EXCLUDED.area_terreno,
      dimensoes_terreno = EXCLUDED.dimensoes_terreno,
      parque_aquatico = EXCLUDED.parque_aquatico,
      salao_festas = EXCLUDED.salao_festas,
      espaco_gourmet = EXCLUDED.espaco_gourmet,
      espaco_zen = EXCLUDED.espaco_zen,
      coworking = EXCLUDED.coworking,
      piquenique = EXCLUDED.piquenique,
      espaco_grill = EXCLUDED.espaco_grill,
      pet_park = EXCLUDED.pet_park,
      supermarket = EXCLUDED.supermarket,
      espaco_gamer = EXCLUDED.espaco_gamer,
      salao_jogos = EXCLUDED.salao_jogos,
      sala_cinema = EXCLUDED.sala_cinema,
      playground = EXCLUDED.playground,
      sala_yoga = EXCLUDED.sala_yoga,
      redario = EXCLUDED.redario,
      horta = EXCLUDED.horta,
      area_convivencia = EXCLUDED.area_convivencia,
      espacos_gourmet_multiplos = EXCLUDED.espacos_gourmet_multiplos,
      academia = EXCLUDED.academia,
      sala_funcional = EXCLUDED.sala_funcional,
      quadra_poliesportiva = EXCLUDED.quadra_poliesportiva,
      quadra_beach_tennis = EXCLUDED.quadra_beach_tennis,
      campo_futebol_society = EXCLUDED.campo_futebol_society,
      quadra_volei_praia = EXCLUDED.quadra_volei_praia,
      quadra_tenis = EXCLUDED.quadra_tenis,
      ciclovia = EXCLUDED.ciclovia,
      pista_cooper = EXCLUDED.pista_cooper,
      controle_acesso_automatizado = EXCLUDED.controle_acesso_automatizado,
      sala_encomendas_delivery = EXCLUDED.sala_encomendas_delivery,
      wi_fi_areas_comuns = EXCLUDED.wi_fi_areas_comuns,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
  `, [
    id,
    dormitorio || 0,
    suite || 0,
    varanda || 0,
    banheiro || 0,
    vaga || 0,
    areaservico || 0,
    quartoservico || 0,
    cozinha || 0,
    lavabo || 0,
    sala || 0,
    area_util || 0,
    area_construida || 0,
    area_terreno || 0,
    dimensoes_terreno || null,
    parque_aquatico,
    salao_festas,
    espaco_gourmet,
    espaco_zen,
    coworking,
    piquenique,
    espaco_grill,
    pet_park,
    supermarket,
    espaco_gamer,
    salao_jogos,
    sala_cinema,
    playground,
    sala_yoga,
    redario,
    horta,
    area_convivencia,
    espacos_gourmet_multiplos,
    academia,
    sala_funcional,
    quadra_poliesportiva,
    quadra_beach_tennis,
    campo_futebol_society,
    quadra_volei_praia,
    quadra_tenis,
    ciclovia,
    pista_cooper,
    controle_acesso_automatizado,
    sala_encomendas_delivery,
    wi_fi_areas_comuns,
    userId
  ]);

  // Se a operação for locação (imbtpoperacao_id === 2), salvar/atualizar na tabela acessória public.produto_servicos_loca
  if (imbtpoperacao_id === 2) {
    const prCondominio = parsePriceBR(condoFeeVal);
    const prIptuanual = parsePriceBR(iptuValueVal);
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

    const resolvedPeriodoLocaId = Number(periodo_loca_id) || 3;

    await query(`
      INSERT INTO public.produto_servicos_loca (
        produto_servico_id, periodo_loca_id, imbfinalidade_id, imbtpimovel_id, preco_base,
        inclusocond, pr_condominio, inclusoiptu, pr_iptuanual, inclusoincendio, pr_segincendio,
        vrtotal, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (produto_servico_id) DO UPDATE SET
        periodo_loca_id = EXCLUDED.periodo_loca_id,
        imbfinalidade_id = EXCLUDED.imbfinalidade_id,
        imbtpimovel_id = EXCLUDED.imbtpimovel_id,
        preco_base = EXCLUDED.preco_base,
        inclusocond = EXCLUDED.inclusocond,
        pr_condominio = EXCLUDED.pr_condominio,
        inclusoiptu = EXCLUDED.inclusoiptu,
        pr_iptuanual = EXCLUDED.pr_iptuanual,
        inclusoincendio = EXCLUDED.inclusoincendio,
        pr_segincendio = EXCLUDED.pr_segincendio,
        vrtotal = EXCLUDED.vrtotal,
        updated_at = NOW()
    `, [
      id,
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

    // Remover da tabela de venda
    await query('DELETE FROM public.produto_servicos_venda WHERE produto_servico_id = $1', [id]);
  } else if (imbtpoperacao_id === 1) {
    // Se a operação for venda (imbtpoperacao_id === 1), salvar/atualizar na tabela acessória public.produto_servicos_venda
    const prCondominio = parsePriceBR(normalizedCustomFields.condominio);
    const prIptuanual = parsePriceBR(normalizedCustomFields.iptu);
    const prSegincendio = parsePriceBR(seguro_incendio);
    const vrtotal = precoBase;

    await query(`
      INSERT INTO public.produto_servicos_venda (
        produto_servico_id, imbfinalidade_id, imbtpimovel_id, preco_base,
        pr_condominio, pr_iptuanual, pr_segincendio, vrtotal, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (produto_servico_id) DO UPDATE SET
        imbfinalidade_id = EXCLUDED.imbfinalidade_id,
        imbtpimovel_id = EXCLUDED.imbtpimovel_id,
        preco_base = EXCLUDED.preco_base,
        pr_condominio = EXCLUDED.pr_condominio,
        pr_iptuanual = EXCLUDED.pr_iptuanual,
        pr_segincendio = EXCLUDED.pr_segincendio,
        vrtotal = EXCLUDED.vrtotal,
        updated_at = NOW()
    `, [
      id,
      imbfinalidade_id || null,
      imbtpimovel_id || null,
      precoBase,
      prCondominio,
      prIptuanual,
      prSegincendio,
      vrtotal
    ]);

    // Remover da tabela de locação
    await query('DELETE FROM public.produto_servicos_loca WHERE produto_servico_id = $1', [id]);
  } else {
    // Remover de ambas
    await query('DELETE FROM public.produto_servicos_loca WHERE produto_servico_id = $1', [id]);
    await query('DELETE FROM public.produto_servicos_venda WHERE produto_servico_id = $1', [id]);
  }

  // 2. Generate Diff
  const changes: Record<string, { old: any, new: any }> = {};
  const fieldsToCompare = {
      nome: title,
      preco_base: precoBase,
      status: status || 'ativo',
      dormitorio: dormitorio || 0,
      suite: suite || 0,
      banheiro: banheiro || 0,
      vaga: vaga || 0,
      varanda: varanda || 0,
      area_util: area_util || 0,
      area_construida: area_construida || 0,
      area_terreno: area_terreno || 0,
      logradouro: logradouroSanitized || null,
      cep: cep || null,
      sala: sala || 0,
      areaservico: areaservico || 0
  };

  const fieldLabels: Record<string, string> = {
      nome: 'Título',
      preco_base: 'Preço',
      status: 'Status',
      dormitorio: 'Dormitório',
      suite: 'Suíte',
      banheiro: 'Banheiro',
      vaga: 'Vaga',
      varanda: 'Varanda',
      area_util: 'Área Útil',
      area_construida: 'Área Const.',
      area_terreno: 'Área Terreno',
      logradouro: 'Endereço',
      cep: 'CEP',
      sala: 'Sala',
      areaservico: 'Área de Serviço'
  };

  for (const [key, newValue] of Object.entries(fieldsToCompare)) {
      const oldValue = oldData[key];
      
      let isDifferent = false;
      const numericFields = ['preco_base', 'dormitorio', 'suite', 'banheiro', 'vaga', 'varanda', 'area_util', 'area_construida', 'area_terreno', 'sala', 'areaservico'];
      
      if (numericFields.includes(key)) {
          isDifferent = Number(oldValue || 0) !== Number(newValue || 0);
      } else {
          isDifferent = String(oldValue || '').trim() !== String(newValue || '').trim();
      }

      if (isDifferent) {
          changes[fieldLabels[key] || key] = { 
            old: (oldValue === null || oldValue === undefined) ? 'vazio' : oldValue, 
            new: (newValue === null || newValue === undefined) ? 'vazio' : newValue 
          };
      }
  }

  // 3. Log the update activity
  await recordAuditLog(Number(id), userId, 'ATUALIZACAO', {
      title,
      status: status || 'ativo',
      changes: Object.keys(changes).length > 0 ? changes : undefined
  });

  return NextResponse.json({ success: true, message: 'Imóvel atualizado com sucesso' });

  } catch (error: any) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Erro ao atualizar imóvel' }, { status: 500 });
  }
}

// DELETE: Remove property and its media
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const userId = decoded.id;

    // 1. Verify ownership and existence
    const res = await query(
      'SELECT id, nome FROM public.produto_servico WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão para excluir' }, { status: 404 });
    }

    // 2. Clear photos from filesystem
    try {
        const photosRes = await query('SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = $1', [id]);
        const { join } = require('path');
        const { unlink, rm } = require('fs/promises');
        
        // Delete each photo file
        for (const photo of photosRes.rows) {
            const filename = photo.url_referencia.split('/').pop();
            const filePath = join(process.cwd(), 'public', 'uploads', 'imoveis', id, filename);
            try {
                await unlink(filePath);
            } catch (e) {
                console.error(`Error deleting file ${filePath}:`, e);
            }
        }
        
        // Delete the entire directory for this property's uploads
        const propertyUploadDir = join(process.cwd(), 'public', 'uploads', 'imoveis', id);
        try {
            await rm(propertyUploadDir, { recursive: true, force: true });
        } catch (e) {
            console.error(`Error removing dir ${propertyUploadDir}:`, e);
        }
    } catch (fsError) {
        console.error('Error clearing files during property delete:', fsError);
        // Continue with DB deletion even if FS cleanup fails
    }

    // 3. Delete from DB
    await query('DELETE FROM produtos_servicos_midia WHERE produto_servico_id = $1', [id]);
    await query('DELETE FROM public.produto_servico_carac WHERE produto_servico_id = $1', [id]);
    await query('DELETE FROM public.produto_servico WHERE id = $1 AND user_id = $2', [id, userId]);

    // 4. Log the deletion
    await recordAuditLog(Number(id), userId, 'EXCLUSAO', {
        title: res.rows[0].nome
    });

    return NextResponse.json({ success: true, message: 'Imóvel excluído com sucesso' });

  } catch (error: any) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Erro ao excluir imóvel' }, { status: 500 });
  }
}
