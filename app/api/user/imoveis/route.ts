
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
                (p.custom_fields->>'pub_facebook')::boolean as pub_facebook,
                (p.custom_fields->>'pub_instagram')::boolean as pub_instagram,
                (SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = p.id AND foto_principal = TRUE LIMIT 1) as foto_capa,
                (SELECT COUNT(*) FROM produtos_servicos_midia WHERE produto_servico_id = p.id) as total_fotos,
                CAST((SELECT COUNT(*) FROM imovel_perguntas WHERE imovel_id = p.id AND status = 'pendente') AS INTEGER) as pending_questions,
                op.descricao as operacao_nome,
                tp.descricao as tipo_nome,
                st.nome as status_imovel_nome
            FROM produtos_servicos p
            LEFT JOIN imbtpoperacao op ON p.imbtpoperacao_id = op.id
            LEFT JOIN imbtpimovel tp ON p.imbtpimovel_id = tp.id
            LEFT JOIN statimovel st ON p.statusimovel = st.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [decoded.id]);

        return NextResponse.json({
            success: true,
            imoveis: res.rows
        });

    } catch (error) {
        console.error('Error fetching user imoveis:', error);
        return NextResponse.json({ error: 'Erro ao buscar imóveis' }, { status: 500 });
    }
}
