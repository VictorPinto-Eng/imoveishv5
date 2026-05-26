
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth-config';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${APP_URL}?error=code_missing`);
    }

    try {
        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${APP_URL}/api/auth/callback/google`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Google token error:', tokens);
            return NextResponse.redirect(`${APP_URL}?error=token_exchange_failed`);
        }

        // 2. Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (googleUser.error) {
            console.error('Google user info error:', googleUser);
            return NextResponse.redirect(`${APP_URL}?error=user_info_failed`);
        }

        const { email, name, id: googleId } = googleUser;

        // 3. Database Sync
        let user;
        const res = await query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (res.rowCount === 0) {
            // Create user
            const insertRes = await query(
                'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
                [name, email, null]
            );
            user = insertRes.rows[0];
        } else {
            user = res.rows[0];
        }

        // Check if user is admin
        const adminRes = await query('SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = $1) as is_admin', [user.id]);
        const isAdmin = adminRes.rows[0]?.is_admin || false;

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, is_admin: isAdmin },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Set cookie and redirect
        const response = NextResponse.redirect(APP_URL);
        
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(`${APP_URL}?error=internal_server_error`);
    }
}
