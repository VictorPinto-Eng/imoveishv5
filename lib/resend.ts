
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendActivationEmail(email: string, name: string, token: string) {
  // Prioriza a variável de ambiente, senão usa o domínio de produção
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hv5.com.br';
  const activationLink = `${appUrl}/api/auth/verify?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'souhv5@gmail.com',
      to: email,
      subject: 'Bem-vindo ao ecossistema HV5 - Ative sua conta',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #333; text-align: center;">Bem-vindo ao ecossistema HV5!</h1>
          <h2 style="color: #555;">Olá, ${name}!</h2>
          <p>Ficamos felizes em ter você conosco. Para ativar sua conta e explorar todas as soluções do nosso ecossistema, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ativar Minha Conta</a>
          </div>
          <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${activationLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Esta é uma mensagem automática da HV5, por favor não responda.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend returned error sending activation email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending activation email:', error);
    return { success: false, error };
  }
}

export async function sendPropertyContactEmail(
  ownerEmail: string, 
  ownerName: string, 
  leadName: string, 
  leadEmail: string, 
  leadPhone: string, 
  message: string,
  propertyName: string,
  propertyId: string | number,
  operacao: string,
  tipoImovel: string
) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'souhv5@gmail.com',
      to: ownerEmail,
      subject: `Cod ${propertyId} - ${operacao} - ${tipoImovel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #e30613; text-align: center;">Novo Lead Recebido!</h1>
          <p>Olá, <strong>${ownerName}</strong>!</p>
          <p>Alguém demonstrou interesse no seu imóvel: <strong>${propertyName}</strong></p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Dados do Interessado:</h3>
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>E-mail:</strong> ${leadEmail}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${leadPhone || 'Não informado'}</p>
          </div>

          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #e30613;">
            <h3 style="margin-top: 0; color: #9a3412;">Mensagem:</h3>
            <p style="font-style: italic; color: #431407;">"${message}"</p>
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
            Recomendamos entrar em contato o mais breve possível para não perder a oportunidade.
          </p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Conectando você ao próximo negócio.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend returned error sending property contact email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending property contact email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hv5.com.br';
  const resetLink = `${appUrl}/recuperar-senha?token=${token}`;
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'souhv5@gmail.com',
      to: email,
      subject: 'Recuperação de Senha - HV5',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no ecossistema HV5.</p>
          <p>Para criar uma nova senha, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #7F34E6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Minha Senha</a>
          </div>
          <p><strong>Importante:</strong> Este link expirará em 1 hora.</p>
          <p>Se você não solicitou a alteração da senha, por favor ignore este e-mail. Sua senha atual permanecerá segura.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Segurança e transparência em cada conexão.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend returned error sending password reset email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

export async function sendCreciStatusEmail(email: string, name: string, approved: boolean) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hv5.com.br';
  const loginLink = `${appUrl}`;

  const subject = approved 
    ? 'Parabéns! Seu CRECI foi homologado no portal HV5' 
    : 'Atenção: Houve um problema com a validação do seu CRECI - HV5';

  const htmlContent = approved 
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #10b981; text-align: center;">CRECI Homologado! 🎉</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Temos o prazer de informar que o seu comprovante de CRECI foi revisado e <strong>aprovado com sucesso</strong> pela nossa equipe!</p>
        <p>Agora o seu perfil de Corretor está 100% active e a publicação dos seus imóveis no site já está liberada.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}" style="background-color: #7F34E6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir para a HV5</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Conectando você ao próximo negócio.</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #ef4444; text-align: center;">Documento de CRECI Recusado ⚠️</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Durante a nossa verificação interna, identificamos um problema com o comprovante de CRECI que você anexou ao seu perfil.</p>
        <p>Por favor, acesse o seu perfil, verifique as informações preenchidas (número, UF) e realize o upload de um comprovante válido (imagem ou PDF contendo os dados legíveis do seu registro ativo).</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Meu Perfil</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Conectando você ao próximo negócio.</p>
      </div>
    `;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'souhv5@gmail.com',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend returned error sending CRECI status email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending CRECI status email:', error);
    return { success: false, error };
  }
}

export async function sendCpfStatusEmail(email: string, name: string, approved: boolean) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hv5.com.br';
  const profileLink = `${appUrl}/meu-perfil`;

  const subject = approved 
    ? 'Parabéns! Seu CPF/CNPJ foi verificado no portal HV5' 
    : 'Atenção: Houve um problema com a verificação do seu CPF/CNPJ - HV5';

  const htmlContent = approved 
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #10b981; text-align: center;">CPF/CNPJ Verificado! 🎉</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Seu CPF/CNPJ foi revisado e <strong>homologado com sucesso</strong> pela nossa equipe de administração!</p>
        <p>Agora sua conta está habilitada para anunciar imóveis no portal.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileLink}" style="background-color: #7F34E6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Meu Perfil</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Conectando você ao próximo negócio.</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #ef4444; text-align: center;">Verificação de CPF/CNPJ Recusada ⚠️</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Identificamos divergências nos dados cadastrais fornecidos para a verificação do seu CPF/CNPJ (ex: data de nascimento incorreta ou nome incompatível).</p>
        <p>Por favor, acesse o seu perfil para corrigir as informações e solicitar uma nova validação.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Meu Perfil</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">HV5 - Conectando você ao próximo negócio.</p>
      </div>
    `;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'souhv5@gmail.com',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend returned error sending CPF status email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending CPF status email:', error);
    return { success: false, error };
  }
}

