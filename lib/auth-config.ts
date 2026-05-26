
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('A variável de ambiente JWT_SECRET é obrigatória em produção para garantir a segurança dos tokens dos usuários.');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
