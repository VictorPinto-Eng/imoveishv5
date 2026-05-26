import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // 2. Protege a rota /meus-imoveis e /admin e sub-rotas
  if (pathname.startsWith('/meus-imoveis') || pathname.startsWith('/admin')) {
    if (!token) {
      console.log(`[Middleware DEBUG] Redirecting ${pathname} -> /`);
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
