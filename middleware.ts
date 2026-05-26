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

  console.log(`[Middleware DEBUG] Path: ${pathname}, Token: ${!!token}`);

  // 2. Protege a rota /meus-imoveis e sub-rotas
  if (pathname.startsWith('/meus-imoveis')) {
    if (!token) {
      console.log(`[Middleware DEBUG] Redirecting ${pathname} -> /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Protege a rota /admin e sub-rotas (exige ser administrador)
  if (pathname.startsWith('/admin')) {
    if (!token) {
      console.log(`[Middleware DEBUG] Redirecting ${pathname} -> /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.is_admin) {
      console.log(`[Middleware DEBUG] Non-admin access block on ${pathname}. Redirecting -> /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configura o middleware para rodar em todas as páginas públicas e privadas
export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas de páginas, exceto:
     * - api (rotas de API internas)
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (serviço de otimização de imagens)
     * - Arquivos com extensão no final (imagens, ícones, etc.)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|.*\\..*|favicon.ico).*)',
  ],
};
