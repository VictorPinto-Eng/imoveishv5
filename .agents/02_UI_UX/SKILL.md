# UI/UX Standards - Currency Fields

Este documento define o padrão de comportamento para campos de moeda no projeto `hv5com`, conforme solicitado pelo Arquiteto Senior.

## 💰 Comportamento de Campos de Moeda

Para todos os campos que envolvem valores monetários (Preço Base, Condomínio, IPTU, etc.), deve-se seguir o padrão **Literal Unit Input** (não o padrão ATM/POS de deslocamento decimal).

### 1. Máscara em Tempo Real (`maskCurrencyInput`)
- Os dígitos digitados devem ser tratados como unidades inteiras.
- **Exemplo**: Digitar `500` deve resultar em `500` (com separador de milhar se necessário, ex: `1.500`).
- **NÃO** deve dividir por 100 durante a digitação (ex: `500` NÃO deve virar `5,00`).
- Deve permitir a inclusão manual de vírgula para centavos.

### 2. Auto-completar (`completeCurrencyWithZeros`)
- Ao sair do campo (`onBlur`) ou pressionar `Enter`, o valor deve ser auto-completado com centavos se necessário.
- **Exemplo**: `500` -> `500,00`. `500,5` -> `500,50`.

### 3. Alinhamento e Estilo
- Campos de moeda devem ser **alinhados à direita** (`text-align: right`).
- O símbolo `R$` deve ser exibido no label ou prefixado conforme a necessidade da tela, mas mantendo a consistência visual.

## 🛠️ Implementação Técnica
As funções utilitárias estão centralizadas em `lib/format.ts`.
- `maskCurrencyInput(value, showPrefix)`
- `completeCurrencyWithZeros(value, showPrefix)`
- `parseCurrencyToNumber(value)`

### Destaque para Inputs Controlados (React)
Para evitar que o sistema "coma" dígitos ou remova o zero à direita enquanto o usuário digita (ex: `.50`), é altamente recomendado usar um **estado local de exibição (string)** enquanto o campo está em foco.

```tsx
// Padrão Recomendado
const [displayValue, setDisplayValue] = useState('');
const [isFocused, setIsFocused] = useState(false);

<input 
  value={isFocused ? displayValue : formatCurrency(valorNumerico)} 
  onFocus={() => {
    setIsFocused(true);
    setDisplayValue(formatCurrency(valorNumerico, false, false, 0));
  }}
  onChange={(e) => {
    const masked = maskCurrencyInput(e.target.value);
    setDisplayValue(masked);
    setValorNumerico(parseCurrencyToNumber(masked));
  }}
  onBlur={() => {
    const completed = completeCurrencyWithZeros(displayValue);
    setValorNumerico(parseCurrencyToNumber(completed));
    setIsFocused(false);
  }}
/>
```

Sempre utilize `onBlur` nos inputs para garantir que o auto-completar seja disparado quando o usuário terminar a edição.
