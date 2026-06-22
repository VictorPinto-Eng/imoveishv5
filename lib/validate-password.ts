/**
 * SEC-09: Validação de força de senha.
 * Mínimo 8 caracteres, pelo menos 1 letra e 1 número.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'A senha deve ter no mínimo 8 caracteres.' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos uma letra.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos um número.' };
  }

  return { valid: true };
}