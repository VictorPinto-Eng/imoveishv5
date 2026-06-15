import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; is_admin?: boolean };
    if (!decoded.is_admin) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    // 1. General Stats Counts
    const usersCountRes = await query('SELECT COUNT(*) FROM users');
    const brokersCountRes = await query('SELECT COUNT(*) FROM users WHERE id_tipo_usuario = 1');
    const ownersCountRes = await query('SELECT COUNT(*) FROM users WHERE id_tipo_usuario = 2');
    const adminsCountRes = await query('SELECT COUNT(*) FROM admin_users');
    
    const salePropertiesRes = await query('SELECT COUNT(*) FROM public.produto_servico WHERE imbtpoperacao_id = 1');
    const rentPropertiesRes = await query('SELECT COUNT(*) FROM public.produto_servico WHERE imbtpoperacao_id = 2');
    const activePropertiesRes = await query("SELECT COUNT(*) FROM public.produto_servico WHERE status = 'ativo'");
    const pendingPropertiesRes = await query("SELECT COUNT(*) FROM public.produto_servico WHERE status = 'Pendente'");
    
    const leadsCountRes = await query('SELECT COUNT(*) FROM leads');
    const questionsCountRes = await query('SELECT COUNT(*) FROM imovel_perguntas');
    const viewsCountRes = await query("SELECT COUNT(*) FROM analytics_events WHERE event_name = 'view_property'");

    // 2. Pending CRECI list
    const pendingCreciRes = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.creci_numero, u.creci_tipo, u.creci_document_url, est.sigla as state_sigla
      FROM users u
      LEFT JOIN apoestado est ON u.creci_apoestado_id = est.id
      WHERE u.id_tipo_usuario = 1 AND u.creci_status = false AND u.creci_document_url IS NOT NULL
      ORDER BY u.updated_at ASC
    `);

    // 2.5. Pending CPF list
    const pendingCpfRes = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.cpf_cnpj, u.data_nascimento, u.razao_social
      FROM users u
      WHERE u.cpf_cnpj IS NOT NULL AND (u.cpf_validated = false OR u.cpf_validated IS NULL)
      ORDER BY u.updated_at ASC
    `);

    // 2.7. All users list with property counts, delete_requested, and CPF/CNPJ details
    const usersListRes = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.social_name,
        u.email, 
        u.phone,
        u.cpf_cnpj,
        u.cpf_validated,
        u.razao_social,
        u.delete_requested,
        u.creci_numero,
        u.creci_tipo,
        u.creci_status,
        u.data_nascimento,
        u.created_at,
        u.id_tipo_usuario,
        (SELECT COUNT(*)::int FROM public.produto_servico WHERE user_id = u.id AND imbtpoperacao_id = 1) as venda_count,
        (SELECT COUNT(*)::int FROM public.produto_servico WHERE user_id = u.id AND imbtpoperacao_id = 2) as locacao_count
      FROM users u
      ORDER BY u.name ASC
    `);

    // 3. Recent Properties list
    const recentPropertiesRes = await query(`
      SELECT p.id, p.nome, p.status, p.created_at, op.descricao as operacao_nome, tp.descricao as tipo_nome,
             COALESCE(pl.preco_base, pv.preco_base, 0) as preco_base
      FROM public.produto_servico p
      LEFT JOIN imbtpoperacao op ON p.imbtpoperacao_id = op.id
      LEFT JOIN public.produto_servicos_loca pl ON p.id = pl.produto_servico_id
      LEFT JOIN public.produto_servicos_venda pv ON p.id = pv.produto_servico_id
      LEFT JOIN imbtpimovel tp ON COALESCE(pl.imbtpimovel_id, pv.imbtpimovel_id) = tp.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: Number(usersCountRes.rows[0]?.count || 0),
        totalBrokers: Number(brokersCountRes.rows[0]?.count || 0),
        totalOwners: Number(ownersCountRes.rows[0]?.count || 0),
        totalAdmins: Number(adminsCountRes.rows[0]?.count || 0),
        propertiesForSale: Number(salePropertiesRes.rows[0]?.count || 0),
        propertiesForRent: Number(rentPropertiesRes.rows[0]?.count || 0),
        activeProperties: Number(activePropertiesRes.rows[0]?.count || 0),
        pendingProperties: Number(pendingPropertiesRes.rows[0]?.count || 0),
        totalLeads: Number(leadsCountRes.rows[0]?.count || 0),
        totalQuestions: Number(questionsCountRes.rows[0]?.count || 0),
        totalViews: Number(viewsCountRes.rows[0]?.count || 0),
      },
      pendingCreci: pendingCreciRes.rows,
      pendingCpf: pendingCpfRes.rows,
      usersList: usersListRes.rows,
      recentProperties: recentPropertiesRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard statistics:', error);
    return NextResponse.json({ error: 'Erro ao carregar estatísticas do painel' }, { status: 500 });
  }
}
