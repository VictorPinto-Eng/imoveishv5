
'use server'

import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/auth-config'

export async function createImovel(formData: FormData) {
    // 1. Auth Validation
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        throw new Error('Não autorizado: Sessão não encontrada');
    }

    try {
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new Error('Sessão inválida ou expirada');
    }

    const nome = formData.get('nome') as string
    const preco_base = Number(formData.get('preco_base'))
    const descricao = formData.get('descricao') as string
    const imagens_urls = formData.get('imagens_urls') as string

    // Custom fields
    const custom_fields = {
        tipo_imovel: formData.get('tipo_imovel'),
        finalidade: formData.get('finalidade'),
        dormitorios: Number(formData.get('dormitorios')),
        banheiros: Number(formData.get('banheiros')),
        vagas: Number(formData.get('vagas')),
        area_total: Number(formData.get('area_total')),
        cidade: formData.get('cidade'),
        estado: formData.get('estado'),
        bairro: formData.get('bairro'),
    }

    // Tags
    const tags = [
        formData.get('cidade'),
        formData.get('bairro'),
        formData.get('tipo_imovel')
    ].filter(Boolean) as string[]



    // Inserir o registro e tratar o resultado corretamente (pg QueryResult)
    try {
        const insertResult = await query(
            `INSERT INTO public.produto_servico (nome, tipo, categoria, preco_base, descricao, ativo, status, imagens_urls, tags, custom_fields, cobranca_tipo, estoque_quantidade, tem_estoque, estoque_minimo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                nome,
                'produto',
                'Imóvel',
                preco_base,
                descricao,
                true,
                'ativo',
                imagens_urls,
                JSON.stringify(tags),
                JSON.stringify(custom_fields),
                'unica',
                1,
                true,
                0
            ]
        );

        // Para o cliente pg, o resultado vem em rows
        const insertedRow = (insertResult as any).rows?.[0] ?? null;
        if (!insertedRow) {
            console.error('Erro: nenhum registro inserido', insertResult);
            throw new Error('Failed to create imovel: no row returned');
        }

        // Garantir relacionamento de 1 para 1 na tabela de características
        await query(`
            INSERT INTO public.produto_servico_carac (
                produto_servico_id,
                dormitorio, banheiro, vaga, area_util
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            insertedRow.id,
            Number(formData.get('dormitorios')) || 0,
            Number(formData.get('banheiros')) || 0,
            Number(formData.get('vagas')) || 0,
            Number(formData.get('area_total')) || 0
        ]);
    } catch (error) {
        console.error('Error creating imovel:', error);
        throw new Error('Failed to create imovel');
    }

    redirect('/imoveis')
}
