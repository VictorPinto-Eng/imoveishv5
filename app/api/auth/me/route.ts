
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

        // The login route uses { id, email, name } in the payload
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };

        const res = await query(
            `SELECT u.id, u.email, u.name, u.social_name, u.avatar_url, u.email_verified, u.id_tipo_usuario, u.phone, 
                    u.creci_numero, u.creci_apoestado_id, u.creci_tipo, u.creci_status,
                    tu.nome as tipo_usuario_nome 
             FROM users u 
             LEFT JOIN tipo_usuario tu ON u.id_tipo_usuario = tu.id 
             WHERE u.id = $1`,
            [decoded.id]
        );

        if (res.rowCount === 0) {
            return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        const user = res.rows[0];

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                social_name: user.social_name,
                avatar_url: user.avatar_url,
                email_verified: user.email_verified,
                id_tipo_usuario: user.id_tipo_usuario,
                user_type_name: user.tipo_usuario_nome,
                phone: user.phone,
                creci_numero: user.creci_numero,
                creci_apoestado_id: user.creci_apoestado_id,
                creci_tipo: user.creci_tipo,
                creci_status: user.creci_status
            }
        });

    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }
}
