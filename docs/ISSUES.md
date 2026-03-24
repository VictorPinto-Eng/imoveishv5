# Registro de Problemas e Soluções

## 1. Filtro de Categoria (2025-12-08)

**Problema:** A listagem de imóveis retornava vazio.
**Causa:** O código filtrava por `categoria = 'Imóvel'` (com acento), mas no banco de dados (Supabase) os registros estão salvos como `Imovel` (sem acento).
**Solução:** Ajustado o filtro no arquivo `lib/imoveis.ts` para usar `'Imovel'`.
**Lição:** Verificar sempre a grafia exata dos valores categóricos no banco de dados antes de definir filtros hardcoded.

## 2. Imagens Quebradas (2025-12-08)

**Problema:** As imagens dos cards não carregavam.
**Causa:** O campo `imagens_urls` no banco vem como uma única string contendo várias URLs separadas por quebra de linha (`\n`). O frontend tentava usar essa string inteira no atributo `src` da tag `<img>`.
**Solução:** Adicionado parser em `lib/imoveis.ts` para dividir a string e usar apenas a primeira URL como imagem principal.
