/**
 * Remove acentos e caracteres especiais, converte para UPPERCASE e limpa espaços extras.
 * Padrão solicitado pelo Arquiteto Senior para tabelas de localização do hv5db.
 */
export function sanitizeLocationName(name: string, trimResult: boolean = true): string {
  if (!name) return '';
  
  const sanitized = name
    .normalize('NFD') // Decompõe caracteres acentuados (ex: 'ã' -> 'a' + '~')
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
    .replace(/[^a-zA-Z0-9\s\/\-\+\*\(\)\:\$\,]/g, '') // Remove caracteres não permitidos
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único
    .toUpperCase();

  return trimResult ? sanitized.trim() : sanitized;
}
