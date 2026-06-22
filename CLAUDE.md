# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start development server (Next.js)
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint (flat config, next/core-web-vitals + typescript)

No test framework is configured.

## Architecture

This is a **Next.js 16 App Router** real estate platform (Brazilian Portuguese) using React 19, TypeScript, and PostgreSQL.

### Data Layer

- **PostgreSQL via `pg` Pool** — raw SQL queries, no ORM, no migrations tool.
- Primary connection: `lib/db.ts` (validates database name is `imob_hv5`).
- Secondary connection: `lib/db-hv5.ts` (uses `HV5_DATABASE_URL`).
- Schema scripts live in `database/` (analytics, activity/audit log).
- Key tables: `produto_servico` (properties), `produto_servico_carac` (characteristics), `produto_servicos_midia` (media), `produto_servicos_loca` (rental), `produto_servicos_venda` (sale), `users`, `admin_users`, `leads`.

### Authentication

Custom JWT auth (no NextAuth). Login issues httpOnly cookie (`token`, 1-day expiry). Registration requires email verification via Resend. Google OAuth handled manually in `/api/auth/callback/google`. Roles: Consumidor (1), Proprietario (2), Corretor (3).

### Key Directories

- `app/api/` — REST route handlers (auth, property, analytics, user, admin, leads, contact)
- `lib/` — core business logic: `imoveis.ts` (property queries/types), `resend.ts` (emails), `analytics-service.ts`, `property-title-prompt.ts` (Google AI title generation)
- `components/` — shared UI components (Header, Footer, modals, cards, filters, maps, galleries)
- `database/` — SQL schema scripts

### Patterns

- Server Components fetch data directly from PostgreSQL; client components call API routes via `fetch`.
- Styling: CSS Modules (one `.module.css` per component/page), global styles in `app/globals.css`.
- No global state library — local `useState`/`useEffect` only. Auth state from `/api/auth/me`.
- File uploads stored in `public/uploads/`, served via catch-all route with directory traversal protection.
- Path alias: `@/*` maps to project root.
- Security headers configured in `next.config.ts`.
- SEO: dynamic sitemap (`app/sitemap.ts`), robots.txt (`app/robots.ts`), metadata in layout.

### External Services

- **Resend** — transactional emails (activation, password reset, lead notifications, CRECI/CPF status)
- **Google Generative AI** — property title generation
- **Leaflet/React-Leaflet** — maps
- **SweetAlert2** — dialog alerts
- **n8n webhook** — Instagram automation

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection (must point to database `imob_hv5`)
- `JWT_SECRET` — JWT signing secret (required in production)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase (shared with Tomik OS CRM)
- `NEXT_PUBLIC_WHATSAPP_PHONE` — WhatsApp number for contact (format: `5511999999999`)
- `NEXT_PUBLIC_APP_URL` — base URL for SEO/links
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — email service
- `HV5_DATABASE_URL` — secondary DB pool (optional)

## Deployment

Target platform is **Vercel**. Production URL: `https://imoveis.hv5.com.br`.
