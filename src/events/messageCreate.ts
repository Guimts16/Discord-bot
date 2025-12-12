import { Events, Message, ChannelType } from "discord.js";
import { perguntarParaIA } from "../utils/aiService";
import { ActivityManager } from "../utils/ActivityManager"; // <--- Importação Essencial

const activityManager = new ActivityManager(); // <--- Instância Global

module.exports = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // 1. Ignorar bots para não gerar loop infinito ou dados falsos
    if (message.author.bot) return;

    // 2. Contabiliza a mensagem para o Gráfico do Dashboard
    // (Isso roda em qualquer canal, gerando estatísticas reais do servidor)
    activityManager.addMessage();

    // -------------------------------------------------------
    // LÓGICA DE ATENDIMENTO (IA)
    // -------------------------------------------------------

    const channel = message.channel;

    // Verifica se é canal de texto
    if (channel.type !== ChannelType.GuildText) return;

    // Verifica se é um ticket de suporte, venda ou compra
    const isTicket =
      channel.name.startsWith("suporte-") ||
      channel.name.startsWith("compra-") ||
      channel.name.startsWith("venda-");

    if (!isTicket) return;

    // Verifica se a IA está ligada neste canal (pelo tópico)
    const topico = (channel as any).topic || "";
    if (!topico.includes("STATUS_IA: ON")) return;

    // Ignora comandos (começados com ! ou /) para não responder a comandos de staff
    if (message.content.startsWith("!") || message.content.startsWith("/"))
      return;

    try {
      // Efeito visual "Digitando..."
      await channel.sendTyping();

      // Limpa o tópico para enviar contexto limpo para a IA
      // (Remove as flags de controle internas)
      let contextoLimpo = topico
        .replace("STATUS_IA: ON", "")
        .replace("STATUS_IA: OFF", "")
        .replace("|", "")
        .trim();

      if (!contextoLimpo)
        contextoLimpo = "Contexto: Dúvida geral sobre o servidor ou produto.";

      // Chama o serviço do Gemini
      const resposta = await perguntarParaIA(message.content, contextoLimpo);

      // Responde mencionando o usuário
      await message.reply(resposta);
    } catch (error) {
      console.error("Erro ao processar resposta da IA:", error);
    }
  },
};
