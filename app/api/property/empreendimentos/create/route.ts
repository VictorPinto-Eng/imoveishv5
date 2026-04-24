import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { descricao, bairro_id, cidade_id, estado_id, pais_id } = body;

        // Basic validation
        if (!descricao || !bairro_id || !cidade_id || !estado_id) {
            return NextResponse.json(
                { error: 'Os campos de Nome, Estado, Cidade e Bairro são obrigatórios.' },
                { status: 400 }
            );
        }

        const insertQuery = `
            INSERT INTO imob_hv5.imbempreendimento (
                descricao, 
                bairro_id, 
                cidade_id, 
                estado_id, 
                pais_id,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, NOW(), NOW()
            ) RETURNING id;
        `;

        const values = [
            descricao, 
            bairro_id, 
            cidade_id, 
            estado_id, 
            pais_id || 1 // Defaults to 1 (Brasil) if not provided
        ];
        
        const result = await query(insertQuery, values);
        
        return NextResponse.json({ 
            success: true, 
            id: result.rows[0].id,
            message: 'Empreendimento cadastrado com sucesso.'
        });

    } catch (error: any) {
        console.error('Erro na API create empreendimento:', error);
        return NextResponse.json(
            { error: 'Erro interno ao salvar no banco de dados. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
