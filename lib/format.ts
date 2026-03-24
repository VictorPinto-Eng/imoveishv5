/**
 * Utilitários para formatação de moeda brasileira (BRL)
 */

/**
 * Formata um número ou string numérica para o padrão R$ 0,00
 * @param value Valor a ser formatado (ex: 1500.50 ou "150050")
 * @param isRawDigits Se true, considera que o valor vem de um input sem pontos (ex: "150050" -> 1500,50)
 */
export const formatCurrency = (value: number | string | undefined | null, isRawDigits = false, showSymbol = true, minDecimals = 2): string => {
  if (value === undefined || value === null) return '';
  
  let numberValue: number;
  
  if (typeof value === 'number') {
    numberValue = value;
  } else {
    if (isRawDigits) {
      // Remove tudo que não é dígito (comportamento para input de máscara)
      const cleanValue = value.replace(/\D/g, '');
      if (!cleanValue) return '';
      numberValue = parseInt(cleanValue) / 100;
    } else {
      // Usa o parser robusto para strings do banco ou formatadas (R$ 1.500,00 ou 1500.00)
      numberValue = parseCurrencyToNumber(value);
    }
  }

  return new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: 2
  }).format(numberValue);
};

/**
 * Converte uma string formatada (R$ 1.234,56) em um número real (1234.56)
 */
export const parseCurrencyToNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  
  // Remove R$, espaços
  let cleanValue = value
    .replace('R$', '')
    .replace(/\s/g, '');
    
  if (cleanValue.includes(',')) {
    // Formato brasileiro: 1.234,56 -> 1234.56
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else {
    // Se não tem vírgula, mas tem ponto, precisamos decidir se o ponto é milhar ou decimal.
    // Regra: se houver apenas UM ponto e ele estiver seguido de EXATAMENTE 3 dígitos, 
    // e o valor total não tiver outras decimais, é provável que seja milhar (comportamento do Formatter).
    // No entanto, para ser mais SEGURO no contexto de UI Brasileira:
    // Se houver pontos, nós os removemos se assumirmos que a entrada é sempre formatada por nós.
    
    // Se a string contém pontos e o usuário não digitou vírgula, 
    // tratamos o ponto como milhar (porque o maskCurrencyInput os insere).
    if (cleanValue.includes('.')) {
      // Caso especial: pode ser formato do banco (1500.50). 
      // Se tiver ponto e o resto forem dígitos, e o ponto estiver na posição de centavos...
      const parts = cleanValue.split('.');
      if (parts.length === 2 && parts[1].length === 2) {
        // Provável formato de banco ou internacional 1500.50
      } else {
        // Provável milhar 1.500
        cleanValue = cleanValue.replace(/\./g, '');
      }
    }
  }
    
  return parseFloat(cleanValue) || 0;
};

/**
 * Adiciona ",00" ao final de um valor digitado se não houver decimais
 */
export const completeCurrencyWithZeros = (value: string, showPrefix: boolean = false): string => {
  if (!value) return '';
  
  // Se já tem vírgula, garante duas casas decimais
  if (value.includes(',')) {
    const parts = value.split(',');
    if (parts[1].length === 0) return value + '00';
    if (parts[1].length === 1) return value + '0';
    return value;
  }
  
  // Se não tem vírgula, adiciona ,00
  return value + ',00';
};

/**
 * Máscara para inputs de moeda que trata dígitos como unidades inteiras (não divide por 100)
 * Ex: digita 500 -> 500. Digita 1500 -> 1.500.
 */
export const maskCurrencyInput = (value: string, showPrefix: boolean = false): string => {
  if (!value) return '';

  // Remove pontos de milhar para evitar confusão com separador decimal
  // em re-formatações (ex: 1.000 não deve virar 1,000 -> 1)
  let cleanValue = value.replace(/\./g, '');
  
  // O último ponto ou vírgula agora é tratado como o separador decimal pretendido pelo usuário
  const lastSeparatorIndex = Math.max(cleanValue.lastIndexOf(','), cleanValue.lastIndexOf('.'));
  
  let integerPartRaw: string;
  let decimalPartRaw: string | null = null;

  if (lastSeparatorIndex !== -1) {
    integerPartRaw = cleanValue.substring(0, lastSeparatorIndex).replace(/\D/g, '');
    decimalPartRaw = cleanValue.substring(lastSeparatorIndex + 1).replace(/\D/g, '').substring(0, 2);
  } else {
    integerPartRaw = cleanValue.replace(/\D/g, '');
  }

  if (!integerPartRaw && decimalPartRaw === null) return '';

  let integerPartFormatted = integerPartRaw 
    ? new Intl.NumberFormat('pt-BR').format(parseInt(integerPartRaw, 10)) 
    : (decimalPartRaw !== null ? '0' : '');
  
  if (decimalPartRaw !== null) {
    return `${integerPartFormatted},${decimalPartRaw}`;
  }
  return integerPartFormatted;
};

/**
 * Máscara para inteiros (apenas dígitos)
 */
export const maskIntegerInput = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Máscara para CEP (#####-###)
 */
export const maskCep = (value: string): string => {
  const clean = value.replace(/\D/g, '').substring(0, 8);
  if (clean.length > 5) {
    return `${clean.substring(0, 5)}-${clean.substring(5)}`;
  }
  return clean;
};

/**
 * Máscara para telefone brasileiro ((##) ####-#### ou (##) #####-####)
 */
export const maskPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '').substring(0, 11);
  if (clean.length === 0) return '';
  
  if (clean.length <= 2) {
    return `(${clean}`;
  }
  if (clean.length <= 6) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
  }
  if (clean.length <= 10) {
    // Fixo: (11) 4444-4444
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
  }
  // Celular: (11) 99999-9999
  return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
};
