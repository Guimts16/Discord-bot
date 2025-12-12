import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, CommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Mostra informações do servidor e botões.'),

    async execute(interaction: CommandInteraction) {
        if (!interaction.guild) return;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Informações de ${interaction.guild.name}`)
            .addFields(
                { name: '👥 Membros', value: `${interaction.guild.memberCount}`, inline: true },
            );

        const btn = new ButtonBuilder()
            .setCustomId('test_button')
            .setLabel('Clique em Mim')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};