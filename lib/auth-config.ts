if (!process.env.JWT_SECRET) {
    throw new Error(
        'A variável de ambiente JWT_SECRET é obrigatória em todos os ambientes. ' +
        'Defina JWT_SECRET no arquivo .env.local para desenvolvimento.'
    );
}

export const JWT_SECRET: string = process.env.JWT_SECRET;
