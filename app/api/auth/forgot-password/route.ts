import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()
        
        // Aqui futuramente será integrada a lógica de envio de e-mail (SendGrid, Resend, etc)
        // Por enquanto, simulamos o sucesso para não quebrar o fluxo do usuário
        
        console.log('Solicitação de recuperação de senha para:', email)

        return NextResponse.json({ 
            message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' 
        }, { status: 200 })
        
    } catch (error: any) {
        return NextResponse.json({ error: 'Erro ao processar solicitação.' }, { status: 500 })
    }
}
