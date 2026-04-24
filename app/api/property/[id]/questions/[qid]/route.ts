import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string, qid: string }> }
) {
    try {
        const { id, qid } = await params
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
