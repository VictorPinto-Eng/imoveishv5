import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { JWT_SECRET } from '@/lib/auth-config'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string, qid: string }> }
) {
    try {
        const { id, qid } = await params

        // Auth: apenas o dono do imóvel pode responder
        const token = req.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        let decoded: { id: number }
        try {
            decoded = jwt.verify(token, JWT_SECRET) as { id: number }
        } catch {
            return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
        }

        // Verificar ownership do imóvel
        const ownerCheck = await query(
            'SELECT user_id FROM public.produto_servico WHERE id = $1',
            [id]
        )
        if (ownerCheck.rowCount === 0) {
            return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
        }
        if (ownerCheck.rows[0].user_id !== decoded.id) {
            return NextResponse.json({ error: 'Sem permissão para responder perguntas deste imóvel' }, { status: 403 })
        }

        const { resposta } = await req.json()

        if (!resposta) {
            return NextResponse.json({ error: 'Resposta é obrigatória' }, { status: 400 })
        }

        const res = await query(
            `UPDATE imovel_perguntas
             SET resposta = $1, status = 'respondida', answered_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND imovel_id = $3
             RETURNING *`,
            [resposta, parseInt(qid), parseInt(id)]
        )

        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
        }

        return NextResponse.json(res.rows[0])
    } catch (error) {
        console.error('Error answering question:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
