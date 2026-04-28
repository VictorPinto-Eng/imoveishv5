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

    const res = await query(
      'SELECT * FROM produtos_servicos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão' }, { status: 404 });
    }

    // Fetch photos from new media table
    const photosRes = await query(
      'SELECT * FROM produtos_servicos_midia WHERE produto_servico_id = $1 ORDER BY ordem_exibicao ASC, id ASC',
      [id]
    );

    // Map relimovel_id back to relationship string for frontend
    const relMapping: Record<number, string> = {
        1: 'Proprietário',
        2: 'Corretor',
        3: 'Administrador/Outro'
    };
    const relationship = relMapping[res.rows[0].relimovel_id] || 'Administrador/Outro';

    const pub_facebook = res.rows[0].custom_fields?.pub_facebook ?? true;
    const pub_instagram = res.rows[0].custom_fields?.pub_instagram ?? true;

    return NextResponse.json({ 
        success: true, 
        imovel: {
            ...res.rows[0],
            relationship,
            pub_facebook,
            pub_instagram,
            // Map singular DB to plural JSON for frontend compatibility
            dormitorios: res.rows[0].dormitorio,
            suites: res.rows[0].suite,
            varandas: res.rows[0].varanda,
            banheiros: res.rows[0].banheiro,
            vagas: res.rows[0].vaga,
            latitude: res.rows[0].latitude || null,
            longitude: res.rows[0].longitude || null,
            plus_code: res.rows[0].plus_code || '',
            pub_site: res.rows[0].pub_site,
            pub_price: res.rows[0].pub_price,
            empreendimento: res.rows[0].imbempreendimento_id,
            photos: photosRes.rows
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
      'SELECT * FROM produtos_servicos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    const oldData = oldRes.rows[0];
    if (!oldData) {
        return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    
    // Partial update support: merge body with oldData
    const title = body.title !== undefined ? body.title : (body.nome !== undefined ? body.nome : oldData.nome);
    const description = body.description !== undefined ? body.description : (body.descricao !== undefined ? body.descricao : oldData.descricao);
    const price = body.price !== undefined ? body.price : (body.preco_base !== undefined ? body.preco_base : oldData.preco_base);
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
    const imbfinalidade_id = body.imbfinalidade_id !== undefined ? body.imbfinalidade_id : oldData.imbfinalidade_id;
    const imbtpimovel_id = body.imbtpimovel_id !== undefined ? body.imbtpimovel_id : oldData.imbtpimovel_id;
    const statusimovel = body.statusimovel !== undefined ? body.statusimovel : oldData.statusimovel;

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
          'INSERT INTO public.apocidade (descricao, estado_id) VALUES ($1, $2) RETURNING id',
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
      'pub_site', 'pub_price', 'relimovel_id', 'prop_id'
    ];

    columnsWithDedicatedStorage.forEach(key => delete normalizedCustomFields[key]);

    // Add back the names for easy display (as requested by previous code logic)
    normalizedCustomFields.uf = ufSigla;
    normalizedCustomFields.cidade = cidadeNome;
    normalizedCustomFields.bairro = bairroNome;
    normalizedCustomFields.tipo_imovel = body.type;
    normalizedCustomFields.finalidade = body.finalidade;
    normalizedCustomFields.pub_facebook = body.pub_facebook !== undefined ? body.pub_facebook : normalizedCustomFields.pub_facebook;
    normalizedCustomFields.pub_instagram = body.pub_instagram !== undefined ? body.pub_instagram : normalizedCustomFields.pub_instagram;

    // Update query
    const updateRes = await query(`
      UPDATE produtos_servicos 
      SET 
        nome = $1, 
        descricao = $2, 
        preco_base = $3, 
        custom_fields = $4,
        status = $5,
        logradouro = $6,
        numero = $7,
        complemento = $8,
        quadra_torre_bloco = $9,
        unidade = $10,
        andar = $11,
        cep = $12,
        pais_id = $13,
        estado_id = $14,
        cidade_id = $15,
        bairro_id = $16,
        dormitorio = $17, 
        suite = $18, 
        varanda = $19, 
        banheiro = $20, 
        vaga = $21,
        areaservico = $22,
        quartoservico = $23,
        cozinha = $24,
        lavabo = $25,
        area_util = $26,
        area_construida = $27,
        area_terreno = $28,
        imbtpoperacao_id = $29,
        imbempreendimento_id = $30,
        imbfinalidade_id = $31,
        imbtpimovel_id = $32,
        statusimovel = $33,
        sala = $34,
        dimensoes_terreno = $35,
        latitude = $36,
        longitude = $37,
        plus_code = $38,
        pub_site = $39,
        pub_price = $40,
        relimovel_id = $41,
        prop_id = $42,
        updated_at = NOW(),
        updated_by = $43,
        organization_id = COALESCE(organization_id, '1')
      WHERE id = $44 AND user_id = $45
      RETURNING id
    `, [
      title || oldData.nome || 'Imóvel sem título', 
      description || '', 
      precoBase, 
      JSON.stringify(normalizedCustomFields), 
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
      dormitorio || 0,
      suite || 0,
      varanda || 0,
      banheiro || 0,
      vaga || 0,
      areaservico || 0,
      quartoservico || 0,
      cozinha || 0,
      lavabo || 0,
      area_util || 0,
      area_construida || 0,
      area_terreno || 0,
      imbtpoperacao_id || null,
      empreendimento || null,
      imbfinalidade_id || null,
      imbtpimovel_id || null,
      statusimovel || null,
      sala || 0,
      dimensoes_terreno || null,
      latitude || null,
      longitude || null,
      plus_code || '',
      pub_site ?? true,
      pub_price ?? true,
      relimovel_id,
      prop_id,
      userId,
      id,
      userId
    ]);

  if (updateRes.rowCount === 0) {
    return NextResponse.json({ error: 'Imóvel não encontrado ou sem permissão para editar' }, { status: 404 });
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
      'SELECT id, nome FROM produtos_servicos WHERE id = $1 AND user_id = $2',
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
    await query('DELETE FROM produtos_servicos WHERE id = $1 AND user_id = $2', [id, userId]);

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
