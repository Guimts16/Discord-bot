import { Events, GuildMember } from "discord.js";
import { StatsManager } from "../utils/StatsManager";
import { logger } from "../utils/LogManager";
const statsManager = new StatsManager();

module.exports = {
  name: Events.GuildMemberAdd,
  execute(member: GuildMember) {
    console.log(`➕ Novo membro: ${member.user.tag}`);
    statsManager.registerJoin();
    logger.info(`➕ Novo membro entrou: ${member.user.tag}`);
  },
};
