import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { JWT_SECRET } from '@/lib/auth-config'

// GET: Fetch questions for a specific property (público)
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

// POST: Submit a new question (requer autenticação)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // SEC-12: Validar sessão — user_id vem do token, não do body
        const token = req.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Não autorizado. Faça login para enviar perguntas.' }, { status: 401 })
        }

        let decoded: { id: number }
        try {
            decoded = jwt.verify(token, JWT_SECRET) as { id: number }
        } catch {
            return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
        }

        const { pergunta } = await req.json()

        if (!pergunta) {
            return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 })
        }

        const res = await query(
            `INSERT INTO imovel_perguntas (imovel_id, user_id, pergunta, status)
             VALUES ($1, $2, $3, 'pendente')
             RETURNING *`,
            [parseInt(id), decoded.id, pergunta]
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
