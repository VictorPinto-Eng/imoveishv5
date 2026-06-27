/**
 * SEC-09 + SEC-26: Validação de força de senha.
 * Mínimo 8 caracteres, máximo 128 (evita DoS bcrypt), pelo menos 1 letra e 1 número.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'A senha deve ter no mínimo 8 caracteres.' };
  }

  // SEC-26: Limite máximo — bcrypt trunca em 72 bytes, mas senhas muito longas
  // causam DoS por CPU no hashing. 128 chars é generoso e seguro.
  if (password.length > 128) {
    return { valid: false, error: 'A senha deve ter no máximo 128 caracteres.' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos uma letra.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos um número.' };
  }

  return { valid: true };
}