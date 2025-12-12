import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'; // <--- Importe ChatInputCommandInteraction
import { ReputationManager } from '../../utils/ReputationManager';

const repManager = new ReputationManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Vê a reputação de um usuário')
        .addUserOption(opt => opt.setName('usuario').setDescription('De quem?')),

    // MUDE AQUI
    async execute(interaction: ChatInputCommandInteraction) {
        const alvo = interaction.options.getUser('usuario') || interaction.user;
        const stats = repManager.getReputation(alvo.id);

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle(`Perfil de ${alvo.username}`)
            .setThumbnail(alvo.displayAvatarURL())
            .addFields(
                { name: '⭐ Nota Média', value: `${stats.average}/5.0`, inline: true },
                { name: '🛒 Vendas/Avaliações', value: `${stats.count}`, inline: true },
            );

        if (stats.lastReview) {
            embed.addFields({ name: '💬 Última Avaliação', value: `"${stats.lastReview.comment}" - <@${stats.lastReview.authorId}>` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};