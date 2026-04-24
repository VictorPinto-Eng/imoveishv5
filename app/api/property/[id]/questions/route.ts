import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: Fetch questions for a specific property
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const all = searchParams.get('all') === 'true'
        
        const res = await query(
            `SELECT * FROM imovel_perguntas 
             WHERE imovel_id = $1 
             ${all ? '' : "AND status = 'respondida'"} 
             ORDER BY created_at DESC`,
            [id]
        )
        
        return NextResponse.json(res.rows)
    } catch (error) {
        console.error('Error fetching questions:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Submit a new question
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { pergunta, user_id } = await req.json()
        
        if (!pergunta) {
            return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 })
        }
        
        // In a real app, we would validate if the user is logged in
        // and handle moderation. For now, we save as 'respondida' for testing
        // or 'pendente' for real use.
        
        console.log('[API Questions] Submitting:', { 
            imovel_id: parseInt(id), 
            user_id: user_id || null, 
            pergunta: pergunta.substring(0, 20) + '...' 
        })

        const res = await query(
            `INSERT INTO imovel_perguntas (imovel_id, user_id, pergunta, status) 
             VALUES ($1, $2, $3, 'pendente') 
             RETURNING *`,
            [parseInt(id), user_id || null, pergunta]
        )
        
        return NextResponse.json(res.rows[0])
    } catch (error: any) {
        console.error('❌ [API Questions] POST Error:', error.message)
        if (error.code === '42P01') {
            return NextResponse.json({ error: 'Tabela imovel_perguntas não existe. Por favor, execute o SQL de criação.' }, { status: 500 })
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
