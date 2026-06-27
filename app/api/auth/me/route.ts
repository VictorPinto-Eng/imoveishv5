
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        // The login route uses { id, email, name, iat } in the payload
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string; iat?: number };

        const res = await query(
            `SELECT u.id, u.email, u.name, u.social_name, u.avatar_url, u.email_verified, u.phone,
                    u.creci_numero, u.creci_apoestado_id, u.creci_tipo, u.creci_status, u.creci_document_url,
                    u.cpf_cnpj, u.data_nascimento, u.cpf_validated, u.razao_social, u.ativo,
                    u.password_changed_at,
                    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = u.id) as is_admin,
                    (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ur.role_id, 'nome', tu.nome)), '[]'::json)
                     FROM public.user_roles ur
                     JOIN public.tipo_usuario tu ON ur.role_id = tu.id
                     WHERE ur.user_id = u.id) as roles_list
              FROM users u
              WHERE u.id = $1`,
            [decoded.id]
        );

        if (res.rowCount === 0 || res.rows[0].ativo === false) {
            return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        const user = res.rows[0];

        // SEC-21: Rejeitar token emitido antes da última troca de senha
        if (user.password_changed_at && decoded.iat) {
            const changedAtSeconds = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
            if (decoded.iat < changedAtSeconds) {
                return NextResponse.json({ authenticated: false }, { status: 200 });
            }
        }

        const roles = user.roles_list || [];

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                social_name: user.social_name,
                avatar_url: user.avatar_url,
                email_verified: user.email_verified,
                roles: roles,
                user_type_name: roles.map((r: any) => r.nome).join(', '),
                phone: user.phone,
                creci_numero: user.creci_numero,
                creci_apoestado_id: user.creci_apoestado_id,
                creci_tipo: user.creci_tipo,
                creci_status: user.creci_status,
                creci_document_url: user.creci_document_url,
                cpf_cnpj: user.cpf_cnpj,
                data_nascimento: user.data_nascimento,
                cpf_validated: user.cpf_validated,
                razao_social: user.razao_social,
                is_admin: user.is_admin
            }
        });

    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }
}
