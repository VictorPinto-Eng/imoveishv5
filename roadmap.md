# 🗺️ Project Roadmap - imoveishv5

Este é o registro central do desenvolvimento do projeto. **Obrigatório atualizar antes de iniciar qualquer nova tarefa.**

---

## 📦 Versionamento

O projeto adota **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Componente | Quando incrementar | Exemplo |
|---|---|---|
| MAJOR | Breaking changes na API pública, migração de banco obrigatória, mudança de arquitetura | 1.0.0 → 2.0.0 |
| MINOR | Nova feature, novo endpoint, melhoria visual significativa | 1.0.0 → 1.1.0 |
| PATCH | Bugfix, correção de estilo, ajuste de texto, fix de segurança | 1.0.0 → 1.0.1 |

### Versão Atual: `0.9.0` (Pré-release / Pré Go-Live)

### Histórico de Versões Planejado

| Versão | Marco | Conteúdo |
|---|---|---|
| `0.9.0` | Estado atual | Todas as features concluídas até 21/06/2026, CRM funcional, LGPD |
| `0.9.1` | Security fixes | SEC-01 a SEC-04 (alta prioridade) |
| `0.9.2` | Performance básica | PERF-02 (fonts), PERF-04 (cache homepage) |
| `1.0.0` | **Go-Live** | Deploy em produção, infra completa, security hardening |
| `1.1.0` | Performance | PERF-01 (next/image), PERF-03 (paginação), PERF-05 (queries) |
| `1.2.0` | Competitive v1 | Simulação financiamento, JSON-LD, busca por mapa aprimorada |
| `1.3.0` | CRM avançado | Lead scoring, auto-response, alertas de busca salva |
| `1.4.0` | Modularização | God Components refatorados, React Hook Form + Zod |
| `2.0.0` | Plataforma | Multi-portal, digital signature, PWA, analytics avançado |

### Convenção de Branches

- `main` — produção estável (protegida)
- `develop` — integração de features (base para PRs)
- `feature/<nome>` — nova funcionalidade
- `fix/<nome>` — correção de bug
- `hotfix/<nome>` — fix crítico direto para main
- `release/x.y.z` — preparação de release

### Convenção de Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

Tipos: feat, fix, perf, sec, refactor, style, docs, chore, ci
Escopo: auth, imoveis, leads, crm, admin, ui, db, infra, seo
```

Exemplos:
- `feat(crm): add lead scoring based on engagement signals`
- `fix(imoveis): use LEFT JOIN to include properties without city`
- `sec(auth): remove hardcoded JWT fallback secret`
- `perf(images): replace img tags with next/image in ImovelCard`

---

## 🟡 Em Desenvolvimento / Backlog Imediato

### Concluídos (aguardando deploy)
- [x] **UI/UX**: Suporte a gestos touch (swipe) na galeria de fotos do `ImovelCard` para dispositivos móveis (Fim: 18/05/2026)
- [x] **Feature**: Identificação automática de Código do Imóvel em leads (WhatsApp/E-mail) (Fim: 29/03/2026)
- [x] **Feature**: Integração com Webhook Externo (webhook.hv5.srv.br) para notificações de leads (Fim: 29/03/2026)
- [x] **UX/UI**: Feedback visual de sucesso ("Mensagem enviada!") após envio de contato (Fim: 29/03/2026)
- [x] **Feature**: Modal de Expansão do Mapa (MapViewerModal) para visualização detalhada e satélite (Fim: 29/03/2026)
- [x] **Feature**: Persistência de Leads em Banco de Dados Local (Tabela `leads`) (Fim: 29/03/2026)
- [x] **UI/UX**: Redesign do Footer Premium (Design, Colunas e Ícones Sociais) (Fim: 30/03/2026)
- [x] **Legal**: Criação da Página de Política de Privacidade com conteúdo LGPD (Fim: 30/03/2026)
- [x] **Legal**: Criação de Skeletons para Termos de Uso e Manual do Usuário (Fim: 30/03/2026)
- [x] Bugfix: Corrigir TypeScript 'produto_servico_id' em `ImovelCard` (Requisito Deploy) (Fim: 30/03/2026)
- [x] Bugfix: Corrigir TypeScript 'isRental' em `ContactStickyCardProps` (Requisito Deploy) (Fim: 30/03/2026)
- [x] Bugfix: Corrigir TypeScript 'pub_site' does not exist on type 'Imovel' (Fim: 28/03/2026)

### Pendentes

- [ ] **🚀 Go-Live**: Realizar deploy inicial em Produção em Servidor Próprio via GitHub (Prioridade: Altíssima)
- [ ] Bugfix: Corrigir pesquisa de imóvel na base de dados — `JOIN` em `apocidade`/`apobairro` exclui imóveis sem cidade/bairro; filtro duplo SQL+memória causa inconsistências (`lib/imoveis.ts:438-544`)
- [ ] Bugfix: Corrigir intermitência e "stale state" no campo de CEP — closure captura valor stale durante debounce (`meus-imoveis/editar/[id]/page.tsx:536-665`)

---

## 🔴 Segurança (Security Debt)

> Auditoria realizada em 21/06/2026. Nenhuma validação de segurança havia sido feita antes.

### Prioridade Alta
- [x] **SEC-01**: Remover fallback hardcoded do JWT secret (`'super_secret_jwt_key_default'`) — falhar em qualquer ambiente sem `JWT_SECRET` definido. ✅ *21/06/2026*
- [x] **SEC-02**: Validar tipo de arquivo nos uploads (whitelist de extensões + MIME type + limite de tamanho). ✅ *21/06/2026*
- [x] **SEC-03**: Corrigir endpoint de enumeração de e-mails — removido campo `verified`, adicionado rate limiting (5 req/min/IP). ✅ *21/06/2026*
- [x] **SEC-04**: Mover webhook URL hardcoded para variável de ambiente (`N8N_LEADS_WEBHOOK_URL`). ✅ *21/06/2026*

### Prioridade Média
- [x] **SEC-05**: Re-verificar status de admin no banco a cada request via `lib/verify-admin.ts` — revogação agora é imediata. ✅ *21/06/2026*
- [x] **SEC-06**: Adicionar `sameSite: 'strict'` no cookie do callback Google OAuth. ✅ *21/06/2026*
- [x] **SEC-07**: Rate limiting via `lib/rate-limit.ts` — login/register (5/15min), forgot-password/resend-verification (3/10min). ✅ *21/06/2026*
- [x] **SEC-08**: Limitar tamanho de upload (5MB imagens, 10MB documentos) — implementado junto com SEC-02. ✅ *21/06/2026*
- [x] **SEC-09**: Validar força da senha (mín 8 chars, 1 letra, 1 número) via `lib/validate-password.ts` em registro, reset e troca. ✅ *21/06/2026*
- [x] **SEC-10**: Debug object (SQL + params) só retornado em development, `undefined` em produção. ✅ *21/06/2026*
- [x] **SEC-11**: Rate limiting (30/min por IP) + validação de event_name no endpoint de analytics. ✅ *21/06/2026*
- [x] **SEC-12**: Endpoint de perguntas agora valida sessão JWT — `user_id` vem do token, não do body. ✅ *21/06/2026*
- [x] **SEC-13**: Restringir `remotePatterns` no `next.config.ts` — limitado a googleusercontent, cloudflare, supabase, hv5. ✅ *21/06/2026*

### Prioridade Baixa
- [x] **SEC-14**: Middleware centralizado (`middleware.ts`) protege rotas `/api/user/*`, páginas privadas. JWT validado via `jose` (Edge). ✅ *22/06/2026*
- [x] **SEC-15**: Sanitizar extensão de arquivo no upload de fotos — implementado junto com SEC-02 (extensão normalizada para lowercase). ✅ *21/06/2026*
- [x] **SEC-16**: Removida dependência `@supabase/supabase-js` não utilizada — 10 pacotes a menos na superfície de ataque. ✅ *21/06/2026*

### Feature de Autenticação
- [ ] **SEC-17**: Verificação de telefone via SMS (Firebase Phone Auth) — código de 6 dígitos enviado por SMS, 10.000 verificações/mês gratuitas. Fluxo: após verificar email, usuário clica "Verificar telefone" no perfil → recebe SMS → digita código → `phone_verified = true`. Expansão futura: migrar para Twilio/AWS SNS quando ultrapassar 10k/mês.

### Pendências da Auditoria v2 (22/06/2026)
- [x] **SEC-18**: Endpoints retornam mensagem genérica ao client — `error.message` removido de todas as respostas 500. ✅ *22/06/2026*
- [ ] **SEC-19**: OAuth Google sem `state` parameter — vulnerável a CSRF no fluxo de login social.
- [ ] **SEC-20**: Token de verificação de email sem expiração — adicionar `expires_at` na tabela e validar.
- [ ] **SEC-21**: JWT não invalidado ao trocar/resetar senha — token roubado continua válido até expirar (24h).
- [ ] **SEC-22**: Google OAuth cria usuário sem verificar `email_verified` da resposta do Google.
- [ ] **SEC-23**: Resend-verification revela existência de email — retornar mensagem genérica independente do resultado.
- [x] **SEC-24**: `/api/property/generate-title` agora exige auth — protege quota da API Gemini. ✅ *22/06/2026*
- [ ] **SEC-25**: Empreendimentos photos sem validação de ownership — qualquer logado pode manipular fotos de qualquer empreendimento.
- [ ] **SEC-26**: Fortalecer política de senha (uppercase, special char, max length para evitar DoS bcrypt).

---

## 🟠 Performance (Débito Técnico)

> Análise realizada em 21/06/2026. Foco em velocidade de abertura e carregamento.

### Prioridade Alta — Impacto Direto no LCP/FCP
- [x] **PERF-01**: `next/image` com `fill` + `sizes` no ImovelCard e PropertyGallery — WebP/AVIF automático, lazy loading, LCP otimizado. ✅ *21/06/2026*
- [x] **PERF-02**: Google Fonts via `next/font` (Inter + Outfit) — elimina 2 requests render-blocking, self-hosted. ✅ *21/06/2026*
- [x] **PERF-03**: Paginação no banco (LIMIT/OFFSET) com `page`, `pageSize`, `sortBy` + componente Pagination + contagem total. ✅ *22/06/2026*
- [x] **PERF-04**: Homepage com `revalidate = 300` (5 min) — eliminadas queries redundantes a cada visita. ✅ *21/06/2026*

### Prioridade Média — Otimização de Queries e Bundle
- [x] **PERF-05**: SELECT leve para cards — removido `I.*`, apenas campos necessários, fotos com LIMIT 10, características reduzidas de 45+ para 5. ✅ *22/06/2026*
- [x] **PERF-06**: `React.cache()` deduplifica `getImovelById` na página detalhe (metadata + render = 1 query). ✅ *21/06/2026*
- [x] **PERF-07**: SweetAlert2 lazy-loaded via `lib/swal.ts` — 47KB removidos do bundle inicial, carregado apenas no primeiro uso. ✅ *21/06/2026*
- [x] **PERF-08**: `PropertyStats.tsx` convertido para Server Component. Demais componentes legitimamente precisam de `'use client'`. ✅ *22/06/2026*
- [x] **PERF-09**: Pool PostgreSQL configurado (max 20, idle 30s, connection timeout 5s, statement timeout 30s). ✅ *21/06/2026*

### Prioridade Baixa — Otimizações Futuras
- [x] **PERF-10**: Favoritos cacheados em memória — 1 fetch único, sem request para visitantes não logados. ✅ *22/06/2026*
- [ ] **PERF-11**: Explorar `generateStaticParams` + ISR para imóveis populares na página de detalhe.
- [ ] **PERF-12**: Páginas estáticas (termos, política, manual, contato) podem ser full static — atualmente re-renderizam a cada request por herdar Header client-side.

---

## 🔵 Arquitetura (Refatoração Estrutural)

### God Components (Risco de Manutenibilidade)
- [ ] **ARCH-01**: Modularizar `app/negocios/page.tsx` (8.339 linhas) — maior arquivo do projeto, impossível de manter/testar. Quebrar em sub-componentes: `PipelineBoard`, `NegociacaoDetail`, `ChatPanel`, `ProposalModal`, etc.
- [ ] **ARCH-02**: Modularizar `app/meus-imoveis/editar/[id]/page.tsx` (2.360 linhas, 21+ useState) — quebrar em `LocationSection`, `CharacteristicsSection`, `MediaSection`, `PricingSection`.
- [ ] **ARCH-03**: Modularizar `app/meus-imoveis/incluir/page.tsx` (2.160 linhas) — mesma estrutura do editar, extrair componentes compartilhados.
- [ ] **ARCH-04**: Modularizar `app/mural/page.tsx` (3.337 linhas) — extrair componentes de postagem, feed e interação.

### Hooks e Reutilização
- [ ] **ARCH-05**: Criar `hooks/useCepLookup.ts` — lógica de CEP duplicada em editar + incluir (~130 linhas cada). Resolve também o bug de stale state.
- [ ] **ARCH-06**: Criar diretório `hooks/` e extrair lógica reusável (`useAuth`, `useFavorites`, `useAnalytics`).

### Forms e Validação
- [ ] **ARCH-07**: Implementar React Hook Form + Zod nas páginas de formulário — atualmente useState individual por campo, onChange manual, validação espalhada em handleSave.

### Organização do Repositório
- [ ] **ARCH-08**: Organizar `components/` em subdiretórios por domínio (40+ arquivos flat): `components/forms/`, `components/modals/`, `components/maps/`, `components/cards/`, `components/layout/`.
- [ ] **ARCH-09**: Criar diretório `types/` para interfaces/tipos compartilhados (atualmente inline em `lib/imoveis.ts`).
- [x] **ARCH-10**: Removido diretório `scratch/` (55 arquivos de testes/debug). `tmp/` já não existia. ✅ *22/06/2026*

---

## 🚀 Infraestrutura de Deploy

> Pré-requisitos para o Go-Live em servidor próprio.

- [x] **INFRA-01**: Dockerfile multi-stage (deps → build → runtime) com Node 20 Alpine, usuário não-root, standalone output. ✅ *21/06/2026*
- [x] **INFRA-02**: `docker-compose.yml` com volume persistente para uploads, healthcheck e variáveis via `.env`. ✅ *21/06/2026*
- [x] **INFRA-03**: GitHub Actions CI — TypeScript check + build em push/PR para main e develop. ✅ *21/06/2026*
- [x] **INFRA-04**: GitHub Actions CD — deploy automático via SSH no push para main (git pull + docker-compose rebuild). ✅ *21/06/2026*
- [x] **INFRA-05**: Caddy reverse proxy com SSL automático (Let's Encrypt), gzip/zstd, headers de segurança, cache para assets. ✅ *21/06/2026*
- [x] **INFRA-06**: `output: 'standalone'` no `next.config.ts` — build gera pacote mínimo para deploy sem node_modules completo. ✅ *21/06/2026*
- [x] **INFRA-07**: Script de backup de uploads — rsync diário incremental + snapshot semanal compactado, retenção de 30 dias. ✅ *21/06/2026*

---

## 🟣 Melhoria Operacional & Competitiva

> Benchmarking baseado nos principais players do mercado imobiliário brasileiro: QuintoAndar, Zap Imóveis/VivaReal, ImovelWeb, Loft, EmCasa. Análise realizada em 21/06/2026.

### Fase 1 — Quick Wins (v1.2.0) — Baixa complexidade, alto impacto

| # | Feature | Benefício | Para quem |
|---|---------|-----------|-----------|
| **COMP-01** | Simulação de Financiamento (SAC/Price) | Calculadora interativa com entrada, prazo e taxa — reduz fricção na decisão de compra | Comprador |
| **COMP-02** | ~~Structured Data (JSON-LD RealEstateListing)~~ ✅ *22/06/2026* | Rich results com geo, imagens, breadcrumb, additionalProperty | Plataforma/SEO |
| **COMP-03** | ~~URLs SEO-friendly~~ ✅ *22/06/2026* | `/imovel/{tipo}/{operacao}/{cidade}/{bairro}/{uuid}` com redirect 301 de URLs legadas, canonical, sitemap atualizado | Plataforma/SEO |
| **COMP-04** | ~~Score de Completude do Anúncio~~ ✅ *22/06/2026* | Barra de progresso + checklist (essencial/recomendado/opcional) na edição do imóvel | Proprietário/Corretor |
| **COMP-05** | Histórico de Preço + Dias no Mercado | Exibe quanto tempo o imóvel está publicado e se o preço mudou — gera confiança | Comprador/Locatário |
| **COMP-06** | Custo Total Mensal (aluguel + condomínio + IPTU) | Mostra o custo real na listagem, não apenas o aluguel | Locatário |
| **COMP-07** | Busca Salva com Alertas por E-mail | Notifica quando novos imóveis correspondem aos critérios salvos | Comprador/Locatário |
| **COMP-08** | Badge de Tempo de Resposta do Corretor | Exibe média de resposta no perfil, incentiva atendimento rápido | Comprador + Corretor |
| **COMP-09** | Verificação de Renda (renda >= 3x aluguel) | Check instantâneo se o usuário se qualifica para o imóvel | Locatário |
| **COMP-10** | Calculadora de Custos de Compra (ITBI, escritura, registro) | Mostra custos extras além do preço do imóvel | Comprador |

### Fase 2 — Diferenciadores (v1.3.0) — Média complexidade, alto impacto

| # | Feature | Benefício | Para quem |
|---|---------|-----------|-----------|
| **COMP-11** | Busca por Mapa com Desenho de Polígono | Usuário desenha área de interesse no mapa (estilo Zap/VivaReal) | Comprador/Locatário |
| **COMP-12** | Agendamento de Visitas com Calendário | Slots disponíveis, confirmação automática, reminder 24h antes | Todos |
| **COMP-13** | Lead Scoring | Rankeia leads por engajamento (views, favoritos, msgs, simulação) | Corretor |
| **COMP-14** | Auto-response em Inquéritos | Resposta automática instantânea confirmando recebimento + dados do imóvel | Corretor/Proprietário |
| **COMP-15** | Dashboard de Performance do Anúncio | Views, favoritos, inquéritos, CTR por listing — corretores adoram dados | Proprietário/Corretor |
| **COMP-16** | OG Images Dinâmicas | Imagem de compartilhamento social gerada automaticamente (foto + preço + localização) | Plataforma/Marketing |
| **COMP-17** | Landing Pages por Bairro | Páginas de conteúdo "Imóveis em [bairro]" com SEO direcionado | Plataforma/SEO |
| **COMP-18** | PWA (Progressive Web App) | App instalável sem app store, push notifications, experiência nativa | Todos |
| **COMP-19** | Sugestão de Preço de Aluguel | ML/comparáveis sugere preço ideal baseado em imóveis similares na região | Proprietário |
| **COMP-20** | Avaliações de Corretores | Sistema de reviews pós-atendimento/transação | Comprador/Locatário |

### Fase 3 — Plataforma Avançada (v2.0.0) — Alta complexidade, diferenciação máxima

| # | Feature | Benefício | Para quem |
|---|---------|-----------|-----------|
| **COMP-21** | Auto-publicação Multi-portal (XML feed) | Um anúncio publicado aqui replica automaticamente para Zap, OLX, ImovelWeb | Corretor/Imobiliária |
| **COMP-22** | Assinatura Digital (Clicksign/D4Sign) | Contratos assinados digitalmente dentro da plataforma | Todos |
| **COMP-23** | Import em Massa (CSV/XML) | Imobiliárias com centenas de imóveis importam de uma vez | Imobiliária |
| **COMP-24** | Tour Virtual 360° | Upload de fotos 360° com visualização imersiva (Matterport-like) | Comprador + Corretor |
| **COMP-25** | Heatmap de Demanda | Visualiza onde as buscas/inquéritos se concentram no mapa | Proprietário/Corretor |
| **COMP-26** | Geração de Contrato | Template de contrato de locação/venda preenchido automaticamente | Proprietário/Corretor |
| **COMP-27** | Validação de Documentos (Matrícula) | Verifica documentação antes de publicar — selo de imóvel verificado | Comprador |
| **COMP-28** | NLP Search | Busca em linguagem natural: "apartamento pet-friendly com varanda perto do metrô" | Comprador/Locatário |
| **COMP-29** | Preço por m² Interativo | Mapa/tabela com valores médios por bairro, atualizado mensalmente | Todos |
| **COMP-30** | Auto-posting Redes Sociais | Novos anúncios publicados automaticamente no Instagram/Facebook | Corretor |

### Itens já existentes (parcial ou completo)

| Feature de mercado | Status no projeto |
|---|---|
| WhatsApp click-to-chat com mensagem preenchida | ✅ Implementado |
| Pipeline CRM (Kanban de leads) | ✅ Implementado |
| Persistência de leads em banco | ✅ Implementado |
| AI-generated descriptions (Google Generative AI) | ✅ Implementado (títulos) |
| Webhook para automação (n8n) | ✅ Implementado |
| Mapa com Leaflet + modal expandido | ✅ Implementado |
| Sitemap dinâmico | ✅ Implementado |
| Favoritos | ✅ Implementado |
| LGPD / Política de Privacidade | ✅ Implementado |
| Verificação de CRECI | ✅ Implementado (upload + validação manual) |

---

## 🧪 Qualidade & Testes

- [ ] **TEST-01**: Configurar Vitest + React Testing Library como framework de testes.
- [ ] **TEST-02**: Testes unitários para `lib/imoveis.ts` (data layer crítico — queries, parsing, filtros).
- [ ] **TEST-03**: Testes de integração para rotas de autenticação (`/api/auth/*`).
- [ ] **TEST-04**: Testes de componentes para `ImovelCard`, `Header`, `LoginModal`.
- [ ] **TEST-05**: Testes E2E básicos com Playwright (fluxo: home → listagem → detalhe → contato).

---

## 📚 Skills de Referência Operacional

> Skills do catálogo `D:\_DEVELOP\SITE\GITHUB\skills\skills\` que guiam a execução de cada frente de trabalho.
> Invocar a skill relevante antes de iniciar qualquer tarefa para garantir alinhamento com melhores práticas.

| Frente | Skills Aplicáveis | Caminho |
|--------|-------------------|---------|
| Next.js / App Router | `nextjs-best-practices`, `nextjs-app-router-patterns` | `skills/nextjs-best-practices/`, `skills/nextjs-app-router-patterns/` |
| React Performance | `react-best-practices`, `react-patterns`, `react-state-management` | `skills/react-best-practices/`, `skills/react-patterns/`, `skills/react-state-management/` |
| PostgreSQL | `postgres-best-practices`, `postgresql`, `postgresql-optimization` | `skills/postgres-best-practices/`, `skills/postgresql/`, `skills/postgresql-optimization/` |
| Performance Geral | `performance-optimizer`, `performance-engineer`, `application-performance-performance-optimization` | `skills/performance-optimizer/`, `skills/performance-engineer/` |
| SEO | `programmatic-seo` | `skills/programmatic-seo/` |
| Segurança API | `api-security-best-practices`, `backend-security-coder`, `frontend-security-coder` | `skills/api-security-best-practices/`, `skills/backend-security-coder/` |
| API Design | `api-design-principles`, `api-patterns` | `skills/api-design-principles/`, `skills/api-patterns/` |
| Acessibilidade | `accessibility-compliance-accessibility-audit`, `fixing-accessibility` | `skills/accessibility-compliance-accessibility-audit/`, `skills/fixing-accessibility/` |
| Forms & Validação | `react-nextjs-development` (fase forms) | `skills/react-nextjs-development/` |
| Database Design | `database-optimizer`, `database-design`, `database-architect` | `skills/database-optimizer/`, `skills/database-design/` |

---

## ⚡ Melhorias Derivadas das Skills (Aplicação Prática)

> Itens concretos extraídos das skills acima, aplicados ao estado atual do projeto.

### Next.js & React (ref: `react-best-practices`, `nextjs-best-practices`)

- [ ] **SKILL-01**: Eliminar async waterfalls — usar `Promise.all()` onde há múltiplos fetches sequenciais independentes (homepage faz 3 queries que poderiam ser paralelas via Promise.all no Server Component).
- [ ] **SKILL-02**: Implementar Suspense boundaries com fallback em páginas de listagem e detalhe — streaming parcial em vez de loading tudo ou nada.
- [ ] **SKILL-03**: Evitar barrel imports — verificar se `lucide-react` está sendo importado via barrel (`import { X } from 'lucide-react'` vs `import X from 'lucide-react/dist/esm/icons/x'`). Impacto direto no tree-shaking.
- [ ] **SKILL-04**: Usar `React.cache()` para deduplicar chamadas ao banco no mesmo request cycle (resolve PERF-06 e padrão recomendado pelo Next.js).
- [ ] **SKILL-05**: Implementar `loading.tsx` em rotas principais (`app/imoveis/`, `app/imovel/[id]/`, `app/negocios/`) para streaming instantâneo com skeleton.
- [ ] **SKILL-06**: Usar `next/dynamic` com `{ ssr: false }` para componentes pesados client-only que não estão assim (verificar LoginModal 1.106 linhas, SweetAlert2 imports).
- [ ] **SKILL-07**: Adotar `startTransition` para atualizações de estado não-urgentes (filtros na listagem, tabs no CRM) — evita jank no input.

### PostgreSQL (ref: `postgres-best-practices`, `postgresql-optimization`)

- [ ] **SKILL-08**: Executar `EXPLAIN ANALYZE` nas queries críticas (`getImoveis`, `getImovelById`) e criar indexes compostos baseados nos WHERE/JOIN mais frequentes.
- [ ] **SKILL-09**: Implementar paginação cursor-based (keyset pagination) em vez de OFFSET para listas grandes — mais performático que OFFSET em tabelas com muitos registros.
- [ ] **SKILL-10**: Adicionar `statement_timeout` no pool (ex: 30s) para evitar queries runaway bloquearem conexões.
- [ ] **SKILL-11**: Usar `NUMERIC` para valores monetários (verificar tipo de `preco_base`) — FLOAT causa erros de arredondamento em cálculos financeiros.
- [ ] **SKILL-12**: Criar index parcial `WHERE pub_site = true` nas queries públicas — reduz escopo do scan para listagens do site.
- [ ] **SKILL-13**: Considerar `pg_trgm` extension + GIN index para buscas por texto (nome do imóvel, endereço) sem LIKE '%...%' full scan.

### Performance & Core Web Vitals (ref: `performance-optimizer`, `performance-engineer`)

- [ ] **SKILL-14**: Definir performance budget: LCP < 2.5s, FID < 100ms, CLS < 0.1, API P95 < 1s. Medir baseline atual com Lighthouse CI.
- [ ] **SKILL-15**: Implementar multi-tier caching: `React.cache()` (request), `unstable_cache` / `revalidate` (data), CDN headers para assets estáticos.
- [ ] **SKILL-16**: Adicionar `content-visibility: auto` em seções below-the-fold (listagem de imóveis após os primeiros 6 cards) — reduz custo de layout/paint.
- [ ] **SKILL-17**: Configurar Brotli compression no reverse proxy (20-30% menor que gzip para HTML/JS/CSS).
- [ ] **SKILL-18**: Implementar preconnect/dns-prefetch para domínios externos frequentes (Google Fonts se mantiver, CDN de imagens, Supabase URL).

### SEO Programático (ref: `programmatic-seo`)

- [ ] **SKILL-19**: Criar landing pages por bairro geradas automaticamente — `/imoveis/[cidade]/[bairro]` com conteúdo dinâmico (total de imóveis, faixa de preço, mapa do bairro).
- [ ] **SKILL-20**: Criar landing pages por tipo de operação — `/apartamentos-para-alugar/[cidade]`, `/casas-a-venda/[cidade]` com dados agregados.
- [ ] **SKILL-21**: Implementar `generateMetadata` dinâmico com título/descrição únicos por imóvel incluindo bairro, preço, m² e características principais.
- [ ] **SKILL-22**: Adicionar breadcrumb structured data (JSON-LD BreadcrumbList) em páginas de detalhe e listagem.

### Segurança (ref: `api-security-best-practices`, `backend-security-coder`)

- [ ] **SKILL-23**: Implementar rate limiting com sliding window — token bucket para API geral (100 req/min), limites estritos para auth (5 tentativas/15min).
- [ ] **SKILL-24**: Adicionar input validation com Zod schemas em todas as rotas POST/PUT — rejeitar payloads inválidos antes de tocar no banco.
- [ ] **SKILL-25**: Implementar CSP (Content Security Policy) com nonce-based scripts — bloqueia XSS mesmo se input escapa sanitização.
- [ ] **SKILL-26**: Adicionar audit logging para ações sensíveis (login, mudança de senha, exclusão de imóvel, alteração de role) — tabela `audit_log` com actor, action, target, timestamp.
- [ ] **SKILL-27**: Implementar RBAC (Role-Based Access Control) centralizado em vez de checks ad-hoc por rota — middleware que mapeia roles (1,2,3) para permissions.

### Acessibilidade (ref: `fixing-accessibility`)

- [ ] **SKILL-28**: Auditoria de acessibilidade nas 5 páginas mais visitadas (home, listagem, detalhe, login, contato) — corrigir aria-labels, keyboard navigation, focus management.
- [ ] **SKILL-29**: Garantir que modais (LoginModal, MapViewerModal, LeadCaptureModal) tenham focus trap, fechamento via ESC, e restaurem foco ao fechar.
- [ ] **SKILL-30**: Substituir `<div onClick>` por `<button>` onde aplicável — garantir que todas as ações interativas são acessíveis via teclado.

### API Design (ref: `api-design-principles`, `api-patterns`)

- [ ] **SKILL-31**: Padronizar envelope de resposta da API: `{ data, meta: { pagination }, error }` em todas as rotas — atualmente cada rota retorna formato diferente.
- [ ] **SKILL-32**: Implementar versionamento de API (header `X-API-Version` ou prefix `/api/v1/`) — preparar para breaking changes sem quebrar clientes existentes.
- [ ] **SKILL-33**: Documentar API com OpenAPI/Swagger schema — facilita integração com apps terceiros e geração de tipos client-side.

---

## 🟢 Concluído

- [x] Feature: Fluxo de Negociação CRM (Interesse ➔ Visita ➔ Proposta ➔ Fechamento) no painel de Negócios — *10/06/2026*
- [x] UI/UX: Centralizar exibição do preço na página pública do imóvel (ContactStickyCard) — *25/05/2026*
- [x] Feature: Atualização do logotipo para o novo arquivo 'logo_hv5_1024.png' — *25/05/2026*
- [x] Release: Publicar aplicação no GitHub — *24/03/2026*
- [x] Feature: Mostrar CEP no banner de confirmação de endereço (Layout Responsivo) — *23/03/2026*
- [x] Feature: Normalização de endereço (Sem acentos/Caixa Alta) nos formulários e APIs — *23/03/2026*
- [x] Bugfix: Foco no e-mail ao abrir o modal de login e navegação via Enter — *23/03/2026*
- [x] Bugfix: Corrigir problema no campo de busca de endereço que impede o uso de espaços — *23/03/2026*
- [x] Fix: Reset de verificação de CEP após declínio (Página de Edição) — *09/01/2025*
- [x] Fix: Intermitência e "stale state" no campo de CEP (Edição e Inclusão) — *09/01/2025*
- [x] Fix: Correção de variável `ufSigla` indefinida em `verifyLocationSequence` — *21/03/2026*
- [x] Fix: Botão "Voltar" da Galeria bloqueado (Z-index) — *21/03/2026*
- [x] Fix: Multiplicação indevida de preço ao salvar (Back-end) — *21/03/2026*
- [x] Feature: Sequência de Modais para Localização (Estado > Cidade > Bairro) — *21/03/2026*
- [x] Standardization: Location Master Tables — busca insensível a acentos e atualização automática de `apocidade`/`apobairro`. — *20/03/2026*
- [x] Smart Location Registration — cadastro automático de Estado, Cidade e Bairro (sanitizados) via CEP. — *19/03/2026*
- [x] Environment Fix: Next.js Dev Lock — remoção de lock file órfão e restauração do servidor de desenvolvimento. — *19/03/2026*
- [x] Currency Governance (Literal Unit Pattern) — refatoração da máscara monetária para padrão literal (500 → 500,00) com `onBlur` auto-completion. — *18/03/2026*
- [x] Refinement: Currency Formatting — campo `preco_base` e valores monetários exibidos como moeda (R$). — *18/03/2026*
- [x] Property Edition Module — página dedicada para edição de imóveis com validação de segurança. — *18/03/2026*
- [x] Property Field Fixes — campos de inteiros exibindo '0' e restauração de spinners. — *19/03/2026*
- [x] Session & Auth Governance — expansão da sessão para 24h e proteção de rotas privadas. — *17/03/2026*
- [x] Cadastro Consolidation — migração de `anunciar` para `meus-imoveis/incluir`. — *17/03/2026*
- [x] Smart Location System — busca por CEP (ViaCEP) e preenchimento automático. — *17/03/2026*
- [x] UI Governance — restauração de Vínculos/Divulgação e botão "+" na sidebar. — *17/03/2026*
- [x] Database Simplification — remoção de `imoveis_detalhes`, listagem direta via `produtos_servicos`. — *17/03/2026*
- [x] Property Grid Fix — query SQL na rota `/api/user/imoveis` com schema legado. — *17/03/2026*
- [x] User Classification — campo para identificar Corretor/Imobiliária ou Proprietário. — *16/03/2026*
- [x] Logo Update — logotipo inicial do sistema. — *16/03/2026*
- [x] Dependency Maintenance — atualização de dependências críticas. — *16/03/2026*
- [x] Setup Inicial — estrutura básica do projeto carregada. — *16/03/2026*
