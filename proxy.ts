import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export default function middleware(request: NextRequest) {
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

  // 2. Protege a rota /meus-imoveis e sub-rotas
  if (pathname.startsWith('/meus-imoveis')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Protege painel do corretor: /mural e /negocios
  if (pathname.startsWith('/mural') || pathname.startsWith('/negocios')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Protege painel do cliente: /meus-favoritos
  if (pathname.startsWith('/meus-favoritos')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 5. Protege a rota /admin e sub-rotas (exige ser administrador)
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

// Configura o proxy para rodar em todas as páginas, exceto assets estáticos
export const config = {
  matcher: [
    /*
     * Aplica o proxy em todas as rotas de páginas, exceto:
     * - api (rotas de API internas)
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (serviço de otimização de imagens)
     * - Arquivos com extensão no final (imagens, ícones, etc.)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|.*\\..*|favicon.ico).*)',
  ],
};
