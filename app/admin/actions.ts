
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

    // Insert imovel using direct DB query instead of Supabase
    const insertResult = await query(`INSERT INTO produtos_servicos (nome, tipo, categoria, preco_base, descricao, ativo, status, imagens_urls, tags, custom_fields, cobranca_tipo, estoque_quantidade, tem_estoque, estoque_minimo)
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
        ]);
    const error = insertResult?.error || null; // Adjust based on actual query result handling

    if (error) {
        console.error('Error creating imovel:', error)
        // In a real app we'd return error state
        throw new Error('Failed to create imovel')
    }

    redirect('/imoveis')
}
