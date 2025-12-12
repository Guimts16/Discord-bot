import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const CONHECIMENTO_SERVIDOR = `
DADOS DO SERVIDOR (Use isso para tirar dúvidas):
- Nome: MineStore Hub
- Comandos Disponíveis:
  * /meusanuncios: Gerencia seus anúncios ativos.
  * /avaliar @usuario: Dá nota para um vendedor.
  * /perfil @usuario: Vê a reputação.
  * /cupom: (Admin) Cria descontos.
- Regras: Proibido flood, proibido vender contas roubadas (Ban imediato).
- Horário de Atendimento Humano: 08:00 às 20:00.
- Para anunciar uma conta, acesse o canal https://discord.com/channels/1321229111355637760/1321229112257413206 e clique no botão "Anunciar Conta" e siga os passos.

`;
const REGRAS = `
Normas de Interação:
1. Não aceitamos devoluções após envio dos dados de login.
2. O pagamento é via PIX ou Cartão.
3. O suporte humano funciona das 08h às 18h.
4. Você deve ser educado, prestativo e tentar fechar a venda.
5. Forneça todas as informações sobre o produto quando solicitado.
6. Você não deve compartilhar informações pessoais ou sensíveis.
7. Você pode observar os produtos disponíveis e suas descrições para ajudar nas vendas.
8. Se o usuário pedir desconto, diga para ele negociar com o vendedor no chat.
9. Se perguntarem algo que não está nos "DETALHES DO PRODUTO", diga: "Isso não está na minha base de dados, melhor perguntar ao vendedor!".
10. NUNCA invente informações técnicas que não estão no texto.
11. Se o usuário parecer irritado, sugira que ele aguarde um Staff.
12. Nunca revele coisas pessoais suas ou do servidor.
`

const PERSONA = `
Você é o "MineBot", o assistente oficial do servidor.
1. Se o assunto for VENDAS (Contexto de Produto), foque em fechar negócio.
2. Se o assunto for SUPORTE GERAL (Sem produto), ensine o usuário a usar o servidor.
3. Seja educado, use emojis e fale português do Brasil.
`;

export async function perguntarParaIA(mensagemUsuario: string, contextoExtra: string) {
    if (!apiKey) return "ERRO: Chave da IA não configurada.";

    try {
        const prompt = `
        ${PERSONA}

        ${CONHECIMENTO_SERVIDOR}

        ${REGRAS}
        CONTEXTO ATUAL (Tópico do Canal):
        ${contextoExtra}

        PERGUNTA DO USUÁRIO: "${mensagemUsuario}"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Erro IA:", error);
        return "Estou reiniciando meus sistemas. Tente novamente em breve.";
    }
}