import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // Google OAuth avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Leaflet map icons
      { protocol: 'https', hostname: 'cdnjs.cloudflare.com' },
      // Supabase storage (mesmo domínio do projeto)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Thumbnails que podem vir de CDNs de portais
      { protocol: 'https', hostname: '*.hv5.com.br' },
      // Desenvolvimento local
      { protocol: 'http', hostname: 'localhost' },
    ],
    // Cache imagens otimizadas por 30 dias (filenames são UUIDs, imutáveis)
    minimumCacheTTL: 2592000,
    // Formatos modernos para menor tamanho
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // Cache agressivo para imagens de upload (UUIDs imutáveis)
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https: http://localhost:*; frame-src 'self' https://www.google.com; object-src 'none'; base-uri 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
