# 🚨 ATENÇÃO – PASSOS OBRIGATÓRIOS ANTES DE RODAR O PROJETO

> ✅ **ANTES DE QUALQUER COISA, VOCÊ PRECISA CONFIGURAR AS CHAVES:**
>
> 1. **Copiar o arquivo de exemplo de ambiente e criar o `.env.local`:**
>    ```bash
>    cp .env.example .env.local
>    ```
>
> 2. **Abrir o arquivo `.env.local`** e substituir os valores de:
>    - `NEXT_PUBLIC_SUPABASE_URL`
>    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
>    - `NEXT_PUBLIC_WHATSAPP_PHONE`
>
> 3. ⚠️ **IMPORTANTE – SUPABASE / TOMIK OS / CRM:**
>    - As chaves do Supabase (`URL` e `ANON KEY`) devem ser as **mesmas** que você já usa no **Tomik OS (CRM/ERP)**.  
>    - Isso garante que o site e o seu CRM estejam usando o **mesmo banco de dados** (`produtos_servicos`).
>
> 4. ⚠️ **IMPORTANTE – WHATSAPP:**
>    - Em `NEXT_PUBLIC_WHATSAPP_PHONE` coloque o **número do WhatsApp que será usado no atendimento**, no formato:  
>      `5511999999999` (sem `+`, sem parênteses, sem traços).

Se você **não fizer esses passos**, o site **não vai conectar** no seu Supabase / Tomik OS e os imóveis **não vão aparecer**.

---

# 🏡 Imobiliária – Template para Alunos

Este é um template de site de imobiliária desenvolvido com [Next.js](https://nextjs.org/) e [Supabase](https://supabase.com/).

O projeto lista imóveis dinamicamente a partir da tabela `produtos_servicos` e direciona interessados para o WhatsApp, usando o **mesmo banco de dados que o Tomik OS (CRM/ERP)**.

---

## ✨ Funcionalidades

- **Home**: Destaques e apresentação da imobiliária.  
- **Listagem de Imóveis**: Filtros e grid de imóveis disponíveis.  
- **Detalhes do Imóvel**: Informações completas e botão de contato.  
- **Integração Supabase**: Leitura de dados em tempo real a partir da tabela `produtos_servicos`.  
- **Contato via WhatsApp**: Links gerados automaticamente com mensagem personalizada.

---

## 🧰 Requisitos

Você vai precisar de:

- [Node.js](https://nodejs.org/) – versão **18 ou superior**  
- Conta no [Supabase](https://supabase.com/)  
- Conta no [GitHub](https://github.com/)  
- Conta na [Vercel](https://vercel.com/) – para deploy  
- Acesso ao **Tomik OS / CRM**, que já usa o projeto Supabase com a tabela `produtos_servicos`

---

## 🚀 Como rodar localmente

Clone o repositório:

# 💻 PASSO A PASSO COMPLETO – SETUP DO PROJETO IMOBILIÁRIA

# 1️⃣ CLONAR O REPOSITÓRIO
git clone https://github.com/ViniciusAutomotikLabs/Imobili-ria-Alunos.git
cd Imobili-ria-Alunos

# 2️⃣ INSTALAR AS DEPENDÊNCIAS
npm install

# 3️⃣ CONFIGURAR AS VARIÁVEIS DE AMBIENTE
cp .env.example .env.local

# 👉 Agora abra o arquivo .env.local e preencha com os dados do SEU projeto Supabase (o mesmo do Tomik OS):

# 🔑 NEXT_PUBLIC_SUPABASE_URL
#    - Vá no painel do Supabase → seu projeto → Settings → API → copie a "Project URL".

# 🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - No mesmo lugar (Settings → API), copie a "anon public key".

# 📱 NEXT_PUBLIC_WHATSAPP_PHONE
#    - Número de WhatsApp que vai receber os contatos dos imóveis, no formato:
#      5511999999999  (código do país + DDD + número, tudo junto – sem +, sem parênteses, sem traços)

# 🔁 LEMBRETE IMPORTANTE:
# - Use as MESMAS credenciais do Supabase que o Tomik OS usa.
# - Assim, o site puxa os MESMOS imóveis que o seu CRM/ERP enxerga (tabela produtos_servicos).

# 4️⃣ RODAR O SERVIDOR DE DESENVOLVIMENTO
npm run dev

# 🌐 ACESSAR O SITE LOCAL
# Abra no navegador:
# http://localhost:3000


# ─────────────────────────────────────────────────────────
# 🗄️ CONFIGURAÇÃO DO SUPABASE (VISÃO GERAL)
# ─────────────────────────────────────────────────────────

# Durante a aula será explicado como:
#   • Garantir que o seu projeto Supabase já está configurado pelo Tomik OS;
#   • Entender a tabela produtos_servicos;
#   • Inserir ou visualizar os imóveis cadastrados.

# ✅ Resumo do que o site espera:

#   • Tabela: produtos_servicos

#   • Campos essenciais (colunas importantes):
#       - id
#       - nome
#       - preco_base
#       - descricao
#       - imagens_urls
#       - categoria           (para o site, deve ser 'Imóvel')
#       - status              (ex.: 'ativo')
#       - ativo               (boolean)
#       - custom_fields       (JSON para detalhes como dormitórios, vagas, área, cidade, etc.)

#   • Filtros usados pelo site nas consultas:
#       - tipo = 'produto'
#       - categoria = 'Imóvel'
#       - status = 'ativo'
#       - ativo = true


# ─────────────────────────────────────────────────────────
# 🌐 DEPLOY NA VERCEL
# ─────────────────────────────────────────────────────────

# Depois que o projeto estiver rodando localmente:

# 1) Suba seu código para um repositório no SEU GitHub (pode ser fork deste).

# 2) Acesse a Vercel e clique em:  "Add New Project"

# 3) Selecione o repositório do GitHub com este projeto.

# 4) Em "Environment Variables", adicione as MESMAS variáveis do .env.local:
#       - NEXT_PUBLIC_SUPABASE_URL
#       - NEXT_PUBLIC_SUPABASE_ANON_KEY
#       - NEXT_PUBLIC_WHATSAPP_PHONE

# 5) Clique em "Deploy" e aguarde.

# 6) Acesse a URL gerada pela Vercel e teste o site online. 🚀


# ─────────────────────────────────────────────────────────
# 🎨 CUSTOMIZAÇÕES SUGERIDAS
# ─────────────────────────────────────────────────────────

# Depois que tudo estiver funcionando, você pode personalizar:

# 🎨 Cores e identidade visual
#   - Ajuste em: app/globals.css
#   - Ou direto nos componentes de layout.

# 📝 Textos da Home
#   - Arquivo principal: app/page.tsx
#   - Mude títulos, subtítulos, chamadas de ação.

# 🔍 Filtros de imóveis
#   - Explore: lib/imoveis.ts
#   - Veja como as consultas ao Supabase são feitas e adicione novos filtros.

# 💬 Mensagem do WhatsApp
#   - O texto padrão é montado no helper:
#       lib/whatsapp.ts
#     pela função:
#       getWhatsappLink()


# ─────────────────────────────────────────────────────────
# 📌 RESUMO RÁPIDO PARA O ALUNO
# ─────────────────────────────────────────────────────────

# 1. Clonar o repositório.
# 2. Rodar: npm install
# 3. Copiar: .env.example → .env.local
# 4. Preencher as envs com os dados do MESMO Supabase usado no Tomik OS + seu WhatsApp.
# 5. Rodar: npm run dev
# 6. Acessar http://localhost:3000 e começar a personalizar.

# ─────────────────────────────────────────────────────────

# 🎓 Bom estudo e boas vendas de imóveis! 🚀🏡