import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { descricao, bairro_id, cidade_id, estado_id, pais_id, cep, possui_carac } = body;

        // Basic validation - ensure required fields are present and numeric IDs
        if (!descricao || !bairro_id || !cidade_id || !estado_id) {
            return NextResponse.json(
                { error: 'Os campos de Nome, Estado, Cidade e Bairro são obrigatórios.' },
                { status: 400 }
            );
        }

        // Ensure IDs are numbers (prevent empty strings)
        const parsedBairroId = Number(bairro_id);
        const parsedCidadeId = Number(cidade_id);
        const parsedEstadoId = Number(estado_id); 
        
        if (isNaN(parsedBairroId) || isNaN(parsedCidadeId) || isNaN(parsedEstadoId)) {
            return NextResponse.json(
                { error: 'IDs de Estado, Cidade e Bairro devem ser números válidos.' },
                { status: 400 }
            );
        }

        const insertQuery = `
            INSERT INTO public.imbempreendimento (
                descricao, 
                bairro_id, 
                cidade_id, 
                estado_id, 
                pais_id,
                cep,
                possui_carac,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
            ) RETURNING id;
        `;

        const values = [
            descricao,
            parsedBairroId,
            parsedCidadeId,
            parsedEstadoId,
            pais_id || 1,
            cep || null,
            possui_carac === true || possui_carac === 'true',
        ];
        
        const result = await query(insertQuery, values);
        
        return NextResponse.json({ 
            success: true, 
            id: result.rows[0].id,
            message: 'Empreendimento cadastrado com sucesso.'
        });

    } catch (error: any) {
        console.error('Erro na API create empreendimento:', { body: await request.clone().json(), errorMessage: error.message, stack: error.stack });
        return NextResponse.json(
            { error: 'Erro interno ao salvar no banco de dados. Tente novamente mais tarde.' },
            { status: 500 }
        );
    }
}
