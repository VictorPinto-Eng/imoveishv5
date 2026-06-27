
import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logout successful' });
    
    // SEC-30: Clear token cookie com sameSite consistent com login
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    return response;
}
