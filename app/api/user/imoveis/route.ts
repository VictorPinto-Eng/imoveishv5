
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

        const res = await query(`
            SELECT 
                p.*,
                p.dormitorio as dormitorios,
                p.suite as suites,
                p.banheiro as banheiros,
                p.vaga as vagas,
                p.varanda as varandas,
                p.pub_facebook,
                p.pub_instagram,
                (SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = p.id AND foto_principal = TRUE LIMIT 1) as foto_capa,
                (SELECT COUNT(*) FROM produtos_servicos_midia WHERE produto_servico_id = p.id) as total_fotos,
                CAST((SELECT COUNT(*) FROM imovel_perguntas WHERE imovel_id = p.id AND status = 'pendente') AS INTEGER) as pending_questions,
                op.descricao as operacao_nome,
                tp.descricao as tipo_nome,
                st.nome as status_imovel_nome,
                bai.descricao as bairro_nome,
                cid.descricao as cidade_nome,
                est.sigla as estado_sigla,
                COALESCE(pl.preco_base, pv.preco_base, 0) as preco_base,
                COALESCE(pl.imbfinalidade_id, pv.imbfinalidade_id) as imbfinalidade_id,
                COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) as imbtpimovel_id,
                pl.inclusocond,
                pl.pr_condominio as loc_pr_condominio,
                pl.inclusoiptu,
                pl.pr_iptuanual as loc_pr_iptuanual,
                pl.inclusoincendio,
                pl.pr_segincendio as loc_pr_segincendio,
                pl.vrtotal as loc_vrtotal,
                pv.pr_condominio as venda_pr_condominio,
                pv.pr_iptuanual as venda_pr_iptuanual,
                pv.pr_segincendio as venda_pr_segincendio,
                pv.vrtotal as venda_vrtotal
            FROM produtos_servicos p
            LEFT JOIN imbtpoperacao op ON p.imbtpoperacao_id = op.id
            LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
            LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
            LEFT JOIN imbtpimovel tp ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = tp.id
            LEFT JOIN statimovel st ON p.statusimovel = st.id
            LEFT JOIN apobairro bai ON p.bairro_id = bai.id
            LEFT JOIN apocidade cid ON p.cidade_id = cid.id
            LEFT JOIN apoestado est ON p.estado_id = est.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [decoded.id]);

        const mappedImoveis = res.rows.map(item => {
            const hasLocacao = item.imbtpoperacao_id === 2;
            const hasVenda = item.imbtpoperacao_id === 1;

            let custom_fields = item.custom_fields;
            if (typeof custom_fields === 'string') {
                try {
                    custom_fields = JSON.parse(custom_fields);
                } catch {
                    custom_fields = {};
                }
            }
            if (!custom_fields) {
                custom_fields = {};
            }

            let condominio_incluso = false;
            let iptu_incluso = false;
            let seguro_incendio_incluso = false;
            let seguro_incendio = 0;
            let vrtotal = Number(item.preco_base || 0);

            if (hasLocacao) {
                if (item.loc_pr_condominio !== null && item.loc_pr_condominio !== undefined) {
                    custom_fields.condominio = Number(item.loc_pr_condominio);
                    custom_fields.valor_condominio = Number(item.loc_pr_condominio);
                }
                if (item.loc_pr_iptuanual !== null && item.loc_pr_iptuanual !== undefined) {
                    custom_fields.iptu = Number(item.loc_pr_iptuanual);
                    custom_fields.valor_iptu = Number(item.loc_pr_iptuanual);
                }
                if (item.inclusocond !== null && item.inclusocond !== undefined) {
                    condominio_incluso = item.inclusocond === '0' || item.inclusocond === 0 || item.inclusocond.toString() === '0';
                }
                if (item.inclusoiptu !== null && item.inclusoiptu !== undefined) {
                    iptu_incluso = item.inclusoiptu === '0' || item.inclusoiptu === 0 || item.inclusoiptu.toString() === '0';
                }
                if (item.inclusoincendio !== null && item.inclusoincendio !== undefined) {
                    seguro_incendio_incluso = item.inclusoincendio === '0' || item.inclusoincendio === 0 || item.inclusoincendio.toString() === '0';
                }
                if (item.loc_pr_segincendio !== null && item.loc_pr_segincendio !== undefined) {
                    seguro_incendio = Number(item.loc_pr_segincendio);
                }
                if (item.loc_vrtotal !== null && item.loc_vrtotal !== undefined) {
                    vrtotal = Number(item.loc_vrtotal);
                }
            } else if (hasVenda) {
                if (item.venda_pr_condominio !== null && item.venda_pr_condominio !== undefined) {
                    custom_fields.condominio = Number(item.venda_pr_condominio);
                    custom_fields.valor_condominio = Number(item.venda_pr_condominio);
                }
                if (item.venda_pr_iptuanual !== null && item.venda_pr_iptuanual !== undefined) {
                    custom_fields.iptu = Number(item.venda_pr_iptuanual);
                    custom_fields.valor_iptu = Number(item.venda_pr_iptuanual);
                }
                if (item.venda_pr_segincendio !== null && item.venda_pr_segincendio !== undefined) {
                    seguro_incendio = Number(item.venda_pr_segincendio);
                }
                if (item.venda_vrtotal !== null && item.venda_vrtotal !== undefined) {
                    vrtotal = Number(item.venda_vrtotal);
                }
            }

            return {
                ...item,
                custom_fields,
                condominio_incluso,
                iptu_incluso,
                seguro_incendio_incluso,
                seguro_incendio,
                vrtotal
            };
        });

        return NextResponse.json({
            success: true,
            imoveis: mappedImoveis
        });

    } catch (error) {
        console.error('Error fetching user imoveis:', error);
        return NextResponse.json({ error: 'Erro ao buscar imóveis' }, { status: 500 });
    }
}
