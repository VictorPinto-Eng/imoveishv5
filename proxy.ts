import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * SEC-14: Proxy centralizado para proteção de rotas (páginas + APIs).
 * Next.js 16 usa proxy.ts em vez de middleware.ts.
 */

// Rotas de API protegidas
const PROTECTED_API_PATTERNS = [
  '/api/user/',
  '/api/leads',
  '/api/property/submit',
];

// APIs públicas (excluídas da proteção)
const PUBLIC_API_ROUTES = [
  '/api/auth/',
  '/api/contact',
  '/api/analytics/',
  '/api/property/estados',
  '/api/property/tipos',
];

function isProtectedApi(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) return false;
  return PROTECTED_API_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Forçar HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    const xForwardedProto = request.headers.get('x-forwarded-proto');
    if (xForwardedProto && xForwardedProto !== 'https') {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  const token = request.cookies.get('token')?.value;

  // 2. Proteger rotas de API
  if (pathname.startsWith('/api/') && isProtectedApi(pathname)) {
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. Protege a rota /meus-imoveis e sub-rotas
  if (pathname.startsWith('/meus-imoveis')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Protege painel do corretor: /mural e /negocios
  if (pathname.startsWith('/mural') || pathname.startsWith('/negocios')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 5. Protege a rota /meu-perfil
  if (pathname.startsWith('/meu-perfil')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 6. Protege a rota /meus-favoritos
  if (pathname.startsWith('/meus-favoritos')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 7. Protege a rota /admin (exige ser administrador)
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Aplica em páginas protegidas + APIs protegidas
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\..*|favicon.ico).*)',
  ],
};
