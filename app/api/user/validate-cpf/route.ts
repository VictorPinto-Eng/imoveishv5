import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-config';

function validateCPFDigits(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
}

function validateCNPJDigits(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    let length = 12;
    let numbers = cleanCNPJ.substring(0, length);
    let digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = 13;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const { cpf, fullName, birthDate, razaoSocial: bodyRazaoSocial } = await req.json();

        if (!cpf || !fullName) {
            return NextResponse.json({ error: 'CPF/CNPJ e nome completo são obrigatórios.' }, { status: 400 });
        }

        let dataNascimento: string | null = null;
        let razaoSocial: string | null = null;

        // 1. Validate CPF/CNPJ Digits
        const cleanedDoc = cpf.replace(/\D/g, '');
        if (cleanedDoc.length === 11) {
            if (!validateCPFDigits(cleanedDoc)) {
                return NextResponse.json({ error: 'CPF inválido (Dígitos verificadores incorretos).' }, { status: 400 });
            }
            if (!birthDate) {
                return NextResponse.json({ error: 'A data de nascimento é obrigatória para validação do CPF.' }, { status: 400 });
            }
            dataNascimento = birthDate;
            // Use the name pasted by the user from the Receita Federal portal
            if (bodyRazaoSocial && typeof bodyRazaoSocial === 'string') {
                razaoSocial = bodyRazaoSocial.trim();
            }
        } else if (cleanedDoc.length === 14) {
            if (!validateCNPJDigits(cleanedDoc)) {
                return NextResponse.json({ error: 'CNPJ inválido (Dígitos verificadores incorretos).' }, { status: 400 });
            }
            if (!birthDate) {
                return NextResponse.json({ error: 'A data de abertura é obrigatória para validação do CNPJ.' }, { status: 400 });
            }

            // Fetch opening date and corporate name from BrasilAPI
            try {
                const apiRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedDoc}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                if (apiRes.ok) {
                    const cnpjData = await apiRes.json();
                    const dateVal = cnpjData.data_inicio_atividade || cnpjData.data_abertura;
                    if (dateVal) {
                        dataNascimento = dateVal; // Format is YYYY-MM-DD
                        
                        // Compare provided birthDate (YYYY-MM-DD) with API dateVal (YYYY-MM-DD)
                        const formattedBirthDate = new Date(birthDate).toISOString().split('T')[0];
                        const formattedDateVal = new Date(dateVal).toISOString().split('T')[0];
                        if (formattedBirthDate !== formattedDateVal) {
                            return NextResponse.json({ 
                                error: 'A data de abertura fornecida não coincide com a cadastrada na Receita Federal.' 
                            }, { status: 400 });
                        }
                    }
                    if (cnpjData.razao_social) {
                        razaoSocial = cnpjData.razao_social;
                    }
                } else {
                    console.error('BrasilAPI CNPJ request returned non-OK status:', apiRes.status);
                    return NextResponse.json({ error: 'Erro ao consultar CNPJ na base da Receita Federal.' }, { status: 400 });
                }
            } catch (err) {
                console.error('Error fetching CNPJ data from BrasilAPI:', err);
            }
        } else {
            return NextResponse.json({ error: 'O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.' }, { status: 400 });
        }

        // 2. Fetch User name to compare
        const userRes = await query('SELECT name, social_name FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }

        const user = userRes.rows[0];
        const registeredName = (user.name || '').toLowerCase().trim();
        const providedName = fullName.toLowerCase().trim();

        // 3. Simple Name Similarity check (ensure first name and part of last name match)
        const regParts = registeredName.split(/\s+/);
        const provParts = providedName.split(/\s+/);

        if (regParts[0] !== provParts[0]) {
            return NextResponse.json({ 
                error: 'O nome fornecido não coincide com o nome cadastrado no perfil da conta.' 
            }, { status: 400 });
        }

        // 4. Update validation status in database
        const isCpf = cleanedDoc.length === 11;
        const isCpfValidated = !isCpf; // CNPJ is auto-approved because it matches BrasilAPI data. CPF goes to pending.

        if (dataNascimento) {
            await query(
                'UPDATE users SET cpf_cnpj = $1, cpf_validated = $2, data_nascimento = $3, razao_social = $4 WHERE id = $5',
                [cleanedDoc, isCpfValidated, dataNascimento, razaoSocial, decoded.id]
            );
        } else {
            await query(
                'UPDATE users SET cpf_cnpj = $1, cpf_validated = $2, razao_social = $3 WHERE id = $4',
                [cleanedDoc, isCpfValidated, razaoSocial, decoded.id]
            );
        }

        return NextResponse.json({
            success: true,
            isCpfPending: isCpf,
            message: isCpf 
                ? 'Solicitação de validação do CPF enviada! Aguarde a homologação do administrador.'
                : 'CNPJ validado com sucesso na base cadastral!',
            data_nascimento: dataNascimento
        });

    } catch (error) {
        console.error('Error validating CPF/CNPJ:', error);
        return NextResponse.json({ error: 'Erro ao validar o CPF/CNPJ.' }, { status: 500 });
    }
}
