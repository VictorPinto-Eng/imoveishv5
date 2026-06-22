/**
 * Converte texto para slug URL-friendly.
 * Remove acentos, lowercase, substitui espaços por hyphens.
 * Ex: "Boa Viagem" → "boa-viagem", "Locação" → "locacao"
 */
export function slugify(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}