import { Events, GuildMember, TextChannel } from "discord.js";
import { AccountManager } from "../utils/AccountManager";
import { StatsManager } from "../utils/StatsManager";

const accountManager = new AccountManager();
const statsManager = new StatsManager();

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember) {
    console.log(`➖ Membro saiu: ${member.user.tag}`);

    // 1. Registra a estatística
    statsManager.registerLeave();

    // 2. Limpa o estoque desse usuário (Segurança)
    const contasDoMembro = accountManager.getBySeller(member.id);
    if (contasDoMembro.length > 0) {
      console.log(
        `🗑️ Removendo ${contasDoMembro.length} anúncios de ${member.user.tag}...`
      );
      for (const conta of contasDoMembro) {
        try {
          if (conta.messageUrl) {
            const parts = conta.messageUrl.split("/");
            const channelId = parts[parts.length - 2];
            const messageId = parts[parts.length - 1];
            const canal = member.guild.channels.cache.get(
              channelId
            ) as TextChannel;
            if (canal) {
              const msg = await canal.messages
                .fetch(messageId)
                .catch(() => null);
              if (msg) await msg.delete();
            }
          }
        } catch (e) {}
        accountManager.deleteAccount(conta.nick);
      }
    }
  },
};
