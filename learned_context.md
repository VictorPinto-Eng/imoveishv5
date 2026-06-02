# Contexto do Projeto e Aprendizados (HV5)

Este documento serve como referência de aprendizado e base de conhecimento para futuras interações com agentes de desenvolvimento e manutenção neste repositório.

---

## 🏛️ Estrutura do Projeto e Convenções

- **Estrutura Next.js**: O projeto utiliza a estrutura do Next.js App Router.
- **Autenticação**:
  - Baseada em JWT utilizando a chave `JWT_SECRET` (obrigatória em produção).
  - O token é armazenado em um cookie chamado `token`.
  - As rotas de API extraem o token usando `req.cookies.get('token')?.value` e verificam via `jwt.verify(token, JWT_SECRET)`.
- **Middleware**:
  - O arquivo [middleware.ts](file:///d:/_DEVELOP/SITE/GITHUB/imoveishv5/middleware.ts) intercepta e protege rotas de páginas como `/meus-imoveis` e `/admin`.
  - **Atenção**: O middleware ignora o diretório `/api`. Por isso, **toda rota de API sensível deve validar o JWT internamente no seu manipulador**.

---

## 🗄️ Banco de Dados e Tabelas Recentes

### 1. Tabela `leads` (Histórico de Mensagens)
Armazena mensagens de contato enviadas pelos usuários.
- **Coluna associada**: Adicionada a coluna `user_id` vinculada à tabela `users(id)` para persistir e listar contatos de usuários logados.

### 2. Tabela `propostas` (Nova)
Armazena propostas de compra ou locação enviadas pelos clientes.
```sql
CREATE TABLE public.propostas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    produto_servico_id INTEGER NOT NULL REFERENCES public.produtos_servicos(id) ON DELETE CASCADE,
    valor NUMERIC(15, 2) NOT NULL,
    condicoes TEXT,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, aceita, recusada
    nome VARCHAR(100),
    email VARCHAR(100),
    telefone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 Componentes e Páginas-Chave

- **Meu Painel (`/meus-favoritos`)**:
  - Atualizado para centralizar a área do cliente.
  - Possui abas dinâmicas para **Favoritos**, **Minhas Propostas** (puxando de `/api/user/proposals`) e **Mensagens Enviadas** (puxando de `/api/user/messages`).
- **Card de Contato (`ContactStickyCard`)**:
  - Localizado na lateral da página de detalhes do imóvel.
  - Contém botões de Contatar, Falar no WhatsApp e o botão **Enviar Proposta** (com modal de proposta integrado).
- **Floating Buttons (`ImovelCard`)**:
  - Os botões flutuantes (Coração e Compartilhar) sobre a imagem no card do imóvel foram ajustados para dimensões de **32px** e ícones internos de **15px** para garantir um visual minimalista e premium.

---

## 🔒 Diretrizes de Segurança do Repositório

1. **SQL Injection**: Sempre use consultas parametrizadas com `$1, $2` etc. através do método `query` importado de `@/lib/db`. Nunca interpole variáveis diretamente no SQL.
2. **Rotas de Debug**: Nunca deixe rotas ativas expondo schemas de tabelas em `/api/debug-...` ou similar.
3. **Validação nas APIs**: Sempre valide `is_admin` ou `user_id` de forma explícita nas rotas sob `/api/admin/` e `/api/user/`.
