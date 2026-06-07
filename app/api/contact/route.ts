
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendPropertyContactEmail } from '@/lib/resend';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, name, email, phone, message } = body;

        if (!propertyId || !name || !email || !message) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // Detect logged in user
        let userId: number | null = null;
        try {
            const token = req.cookies.get('token')?.value;
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
                userId = decoded.id;
            }
        } catch (authError) {
            // Ignore auth errors, just record as anonymous
        }

        // Fetch property owner info
        const res = await query(`
            SELECT 
                p.nome as property_name,
                u.email as owner_email,
                u.name as owner_name,
                OP.descricao as operacao,
                TP.descricao as tipo_imovel
            FROM public.produto_servico p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN imbtpoperacao OP ON p.imbtpoperacao_id = OP.id
            LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
            LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
            LEFT JOIN imbtpimovel TP ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = TP.id
            WHERE p.id = $1
        `, [propertyId]);

        if (res.rowCount === 0) {
            console.warn(`Owner not found for property ${propertyId}`);
            return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 404 });
        }

        const { property_name, owner_email, owner_name, operacao, tipo_imovel } = res.rows[0];

        // 1. Save to Database (Leads)
        await query(`
            INSERT INTO leads (produto_servico_id, user_id, nome, email, telefone, mensagem)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [propertyId, userId, name, email, phone, message]);

        // 2. Send Email
        const emailRes = await sendPropertyContactEmail(
            owner_email,
            owner_name,
            name,
            email,
            phone,
            message,
            property_name,
            propertyId,
            operacao || 'Venda',
            tipo_imovel || 'Imóvel'
        );

        if (!emailRes.success) {
            throw new Error('Falha ao enviar e-mail');
        }

        return NextResponse.json({ success: true, message: 'Contato enviado com sucesso' });

    } catch (error) {
        console.error('Error in /api/contact:', error);
        return NextResponse.json({ error: 'Erro interno ao processar contato' }, { status: 500 });
    }
}
