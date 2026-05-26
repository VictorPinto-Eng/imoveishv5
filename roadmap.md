# 🗺️ Project Roadmap - imoveishv5

Este é o registro central do desenvolvimento do projeto. **Obrigatório atualizar antes de iniciar qualquer nova tarefa.**

## 🟡 Em Desenvolvimento / Backlog Imediato
- [x] **UI/UX**: Suporte a gestos touch (swipe) na galeria de fotos do `ImovelCard` para dispositivos móveis (Fim: 18/05/2026)
- [x] **Feature**: Identificação automática de Código do Imóvel em leads (WhatsApp/E-mail) (Fim: 29/03/2026)
- [x] **Feature**: Integração com Webhook Externo (webhook.hv5.srv.br) para notificações de leads (Fim: 29/03/2026)
- [x] **UX/UI**: Feedback visual de sucesso ("Mensagem enviada!") após envio de contato (Fim: 29/03/2026)
- [x] **Feature**: Modal de Expansão do Mapa (MapViewerModal) para visualização detalhada e satélite (Fim: 29/03/2026)
- [x] **Feature**: Persistência de Leads em Banco de Dados Local (Tabela `leads`) (Fim: 29/03/2026)
- [x] **UI/UX**: Redesign do Footer Premium (Design, Colunas e Ícones Sociais) (Fim: 30/03/2026)
- [x] **Legal**: Criação da Página de Política de Privacidade com conteúdo LGPD (Fim: 30/03/2026)
- [x] **Legal**: Criação de Skeletons para Termos de Uso e Manual do Usuário (Fim: 30/03/2026)
- [ ] **🚀 Go-Live**: Realizar deploy inicial em Produção em Servidor Próprio via GitHub (Prioridade: Altíssima)
- [ ] Refactor: Limpeza e Organização do Repositório (src/ layout) (Início: 24/03/2026)
- [x] Bugfix: Corrigir TypeScript 'produto_servico_id' em `ImovelCard` (Requisito Deploy) (Fim: 30/03/2026)
- [x] Bugfix: Corrigir TypeScript 'isRental' em `ContactStickyCardProps` (Requisito Deploy) (Fim: 30/03/2026)
- [x] Bugfix: Corrigir TypeScript 'pub_site' does not exist on type 'Imovel' (Fim: 28/03/2026)
- [ ] Bugfix: Corrigir intermitência e "stale state" no campo de CEP (Débito Técnico - Adiado pós-deploy)
- [ ] Bugfix: Corrigir pesquisa de imóvel na base de dados (Débito Técnico - Adiado pós-deploy)
- [ ] **Architecture Refactor**: Isolar lógica de busca de CEP em um Custom Hook (`useCepLookup`) para resolver bugs de "stale state" de forma definitiva. (Débito Técnico)
- [ ] **Architecture Refactor**: Modularizar a página `meus-imoveis/editar` quebrando o "God Component" em sub-componentes especializados (ex: `LocationSection`, `CharacteristicsSection`). (Débito Técnico)
- [ ] **Architecture Refactor**: Avaliar e implementar biblioteca de formulários (React Hook Form + Zod) para simplificar o gerenciamento de estado e validações na página de edição. (Débito Técnico)
- [ ] Novos módulos e refinamentos sob demanda.

## 🔴 Roadmap (Futuro)
- [ ] Implementação de novos módulos conforme solicitado.
- [ ] Implementação de Simulação de Financiamento (🟡 Futuro)

## 🟢 Concluído
- [x] UI/UX: Centralizar exibição do preço na página pública do imóvel (ContactStickyCard) - *25/05/2026*
- [x] Feature: Atualização do logotipo para o novo arquivo 'logo_hv5_1024.png' - *25/05/2026*
- [x] Release: Publicar aplicação no GitHub - *24/03/2026*
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
