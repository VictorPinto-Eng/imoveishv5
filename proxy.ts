import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWT_SECRET } from './lib/auth-config';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[Proxy DEBUG] Path: ${pathname}, Token: ${!!token}`);

  // Protege a rota /meus-imoveis e /admin e sub-rotas
  if (pathname.startsWith('/meus-imoveis') || pathname.startsWith('/admin')) {
    if (!token) {
      console.log(`[Proxy DEBUG] Redirecting ${pathname} -> /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configura em quais caminhos o middleware deve rodar
export const config = {
  matcher: [
    '/meus-imoveis',
    '/meus-imoveis/:path*',
    '/admin',
    '/admin/:path*'
  ],
};
