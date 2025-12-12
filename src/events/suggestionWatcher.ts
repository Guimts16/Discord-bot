import { Events, Message, EmbedBuilder, ChannelType } from 'discord.js';
import { AccountManager } from '../utils/AccountManager';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const accountManager = new AccountManager();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;

        if (message.channel.id !== process.env.CANAL_SUGESTOES_ID) return;
        if (!message.channel.isTextBased()) return;
        if (message.channel.isDMBased()) return;

        await message.channel.sendTyping();

        const estoque = accountManager.getAllAvailable();

        if (estoque.length === 0) {
            return message.reply("😔 Desculpe, nosso estoque está vazio no momento.");
        }

        const resumoEstoque = estoque.map(acc => 
            `- Nick: ${acc.nick} | Preço: ${acc.price} | Vips: ${acc.vips} | Link: ${acc.messageUrl}`
        ).join('\n');

        try {
            const prompt = `
            Você é um vendedor experiente de contas de Minecraft.
            
            ESTOQUE DISPONÍVEL (Dados Reais):
            ${resumoEstoque}

            O CLIENTE PROCURA: "${message.content}"

            TAREFA:
            1. Analise o que o cliente quer e procure no estoque a MELHOR opção.
            2. Se encontrar algo parecido, recomende com entusiasmo e forneça o LINK.
            3. Se não tiver nada a ver, diga educadamente que não temos no momento, mas sugira outra conta boa do estoque.
            4. Responda em português, curto e direto.
            5. IMPORTANTE: Você DEVE incluir o link da conta recomendada.
            6. Caso o úsuario fale algo que não seja relacionado a compra, responda educadamente que você é um vendedor de contas de Minecraft e está ali para ajudar com isso, mas não precisa oferecer uma conta se for este o caso.
            7. NUNCA invente contas que não estão no estoque.
            8. Mantenha a resposta em até 3 parágrafos.
            9. Caso não haja contas no estoque, informe que o estoque está vazio no momento.
            `;

            const result = await model.generateContent(prompt);
            const respostaIA = result.response.text();

            await message.reply(respostaIA);

        } catch (error) {
            console.error(error);
            await message.reply("😵 Tive um erro ao consultar o catálogo. Tente de novo.");
        }
    }
};