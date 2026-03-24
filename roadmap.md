# 🗺️ Project Roadmap - hv5com

Este é o registro central do desenvolvimento do projeto. **Obrigatório atualizar antes de iniciar qualquer nova tarefa.**

## 🟡 Em Desenvolvimento
- [ ] Release: Publicar aplicação no GitHub (🟡 Em Desenvolvimento) (Início: 24/03/2026)
- [ ] Bugfix: Corrigir intermitência e "stale state" no campo de CEP (🟡 Em Desenvolvimento)
- [ ] Bugfix: Corrigir pesquisa de imóvel na base de dados (🟡 Em Desenvolvimento)
- [ ] Novos módulos e refinamentos sob demanda.

## 🔴 Roadmap (Futuro)
- [ ] Implementação de novos módulos conforme solicitado.
- [ ] Implementação de Simulação de Financiamento (🟡 Futuro)

## 🟢 Concluído
- [x] Feature: Mostrar CEP no banner de confirmação de endereço (Layout Responsivo) - *23/03/2026*
- [x] Feature: Normalização de endereço (Sem acentos/Caixa Alta) nos formulários e APIs - *23/03/2026*
- [x] Bugfix: Foco no e-mail ao abrir o modal de login e navegação via Enter - *23/03/2026*
- [x] Bugfix: Corrigir problema no campo de busca de endereço que impede o uso de espaços - *23/03/2026*
- [x] Fix: Reset de verificação de CEP após declínio (Página de Edição) - *09/01/2025*
- [x] Fix: Intermitência e "stale state" no campo de CEP (Edição e Inclusão) - *09/01/2025*
- [x] Fix: Correção de variável `ufSigla` indefinida em `verifyLocationSequence` - *21/03/2026*
- [x] Fix: Botão "Voltar" da Galeria bloqueado (Z-index) - *21/03/2026*
- [x] Fix: Multiplicação indevida de preço ao salvar (Back-end) - *21/03/2026*
- [x] Feature: Sequência de Modais para Localização (Estado > Cidade > Bairro)
- **Standardization: Location Master Tables**: Implementação de busca insensível a acentos e atualização automática de `apocidade`/`apobairro` para nomes sanitizados. (Fim: 20/03/2026)
- **Environment Fix: Next.js Dev Lock**: Remoção de lock file órfão e restauração do servidor de desenvolvimento. (Fim: 19/03/2026)
- **Environment Fix: Next.js Dev Lock**: Remoção de lock file órfão e restauração do servidor de desenvolvimento. (Fim: 19/03/2026)
- **Smart Location Registration**: Sistema de cadastro automático de Estado, Cidade e Bairro (sanitizados) via CEP. (Início: 19/03/2026 - Fim: 19/03/2026)
- **Currency Governance (Literal Unit Pattern)**: Refatoração completa da máscara monetária para o padrão de entrada literal (ex: 500 -> 500,00), incluindo `onBlur` auto-completion e documentação em Skill dedicada. (Fim: 18/03/2026)

- **Refinement: Currency Formatting**: Garantir que o campo `preco_base` e outros valores monetários sejam exibidos como moeda (R$). (Fim: 18/03/2026)
- **Property Edition Module**: Implementação de página dedicada para edição de imóveis com validação de segurança e reuso de lógica. (Início: 17/03/2026 - Fim: 18/03/2026)
- **Property Field Fixes**: Ajuste nos campos de números inteiros para exibir '0' corretamente e restauração de spinners (up/down). (Fim: 19/03/2026)
- **Session & Auth Governance**: Expansão da sessão para 24h e proteção obrigatória de rotas privadas via Middleware. (Início: 17/03/2026 - Fim: 17/03/2026)
- **Cadastro Consolidation**: Migração e renomeação da tela de cadastro de `anunciar` para `meus-imoveis/incluir`. (Início: 17/03/2026 - Fim: 17/03/2026)
- **Smart Location System**: Implementação de busca por CEP (ViaCEP) e preenchimento automático na edição de imóveis. (Início: 17/03/2026 - Fim: 17/03/2026)
- **UI Governance**: Restauração de seções de Vínculos e Divulgação, e inclusão do botão "+" na barra lateral. (Início: 17/03/2026 - Fim: 17/03/2026)
- **Database Simplification**: Remoção da tabela `imoveis_detalhes` e refatoração das APIs para listagem direta via `produtos_servicos`. (Início: 17/03/2026 - Fim: 17/03/2026)
- **Property Grid Fix**: Correção da query SQL na rota `/api/user/imoveis` para suportar o schema legado (`imbtpimovel`). (Início: 17/03/2026 - Fim: 17/03/2026)
- **Senior Architect Governance**: Implementação do perfil de Arquiteto Full-Stack Sênior e novo padrão de governança e respostas estruturadas. (Início: 17/03/2026 - Fim: 17/03/2026)
- **User Classification**: Adição de campo para identificar Corretor(a) / Imobiliária ou Proprietário(a). (Início: 16/03/2026 - Fim: 16/03/2026)
- **Logo Update**: Atualização do logotipo inicial do sistema. (Início: 16/03/2026 - Fim: 16/03/2026)
- **Dependency Debug**: Silenciamento do aviso `baseline-browser-mapping` via variáveis de ambiente no `package.json`. (Fim: 16/03/2026)
- **Dependency Maintenance**: Atualização de dependências críticas. (Fim: 16/03/2026)
- **Roadmap Enforcement**: Atualização das Skills para governança de Roadmap. (Fim: 16/03/2026)
- **Setup Inicial**: Estrutura básica do projeto carregada. (Fim: 16/03/2026)
