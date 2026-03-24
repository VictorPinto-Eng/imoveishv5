
import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logout successful' });
    
    // Clear the token cookie
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/',
    });

    return response;
}
