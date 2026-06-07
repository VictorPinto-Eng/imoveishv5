import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: propertyId } = await params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const userId = decoded.id;

        // Verify ownership
        const ownerRes = await query(
            'SELECT id FROM public.produto_servico WHERE id = $1 AND user_id = $2',
            [propertyId, userId]
        );
        if (ownerRes.rowCount === 0) {
            return NextResponse.json({ error: 'Proibido' }, { status: 403 });
        }

        // Fetch Audit Logs
        const logsRes = await query(`
            SELECT 
                l.id,
                l.acao as type,
                l.detalhes as details,
                l.created_at,
                u.name as user_name
            FROM produtos_servicos_log l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.produto_servico_id = $1
            ORDER BY l.created_at DESC
            LIMIT 50
        `, [propertyId]);

        // Fetch Leads
        const leadsRes = await query(`
            SELECT 
                id,
                'lead_received' as type,
                json_build_object('nome', nome, 'email', email, 'telefone', telefone, 'mensagem', mensagem) as details,
                created_at,
                'Cliente Site' as user_name
            FROM leads
            WHERE produto_servico_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [propertyId]);

        // Fetch Analytics Events (High impact ones)
        const eventsRes = await query(`
            SELECT 
                id,
                event_name as type,
                payload as details,
                created_at,
                'Sistema (Visitante)' as user_name
            FROM analytics_events
            WHERE produto_servico_net_id = (SELECT id FROM produto_servico_net WHERE produto_servico_id = $1)
              AND event_name IN ('click_whatsapp', 'click_phone', 'lead_submit', 'share_property')
            ORDER BY created_at DESC
            LIMIT 50
        `, [propertyId]);

        // Merge and sort
        const allActivities = [...logsRes.rows, ...leadsRes.rows, ...eventsRes.rows].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ 
            success: true, 
            activities: allActivities 
        });

    } catch (error: any) {
        console.error('Activities Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
