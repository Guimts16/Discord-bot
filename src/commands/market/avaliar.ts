import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js'; // <--- Importe ChatInputCommandInteraction
import { ReputationManager } from '../../utils/ReputationManager';

const repManager = new ReputationManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avaliar')
        .setDescription('Avalie um vendedor')
        .addUserOption(opt => opt.setName('vendedor').setDescription('Quem você comprou?').setRequired(true))
        .addIntegerOption(opt => opt.setName('estrelas').setDescription('Nota (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
        .addStringOption(opt => opt.setName('comentario').setDescription('Como foi a venda?').setRequired(true)),

    // MUDE AQUI DE: CommandInteraction PARA: ChatInputCommandInteraction
    async execute(interaction: ChatInputCommandInteraction) { 
        const vendedor = interaction.options.getUser('vendedor');
        const estrelas = interaction.options.getInteger('estrelas') || 5;
        const comentario = interaction.options.getString('comentario') || "";

        if (vendedor?.id === interaction.user.id) {
            return interaction.reply({ content: '❌ Você não pode se autoavaliar.', flags: MessageFlags.Ephemeral });
        }

        repManager.addReview(vendedor!.id, {
            authorId: interaction.user.id,
            stars: estrelas,
            comment: comentario,
            timestamp: new Date().toISOString()
        });

        await interaction.reply(`✅ **Sucesso!** Você avaliou ${vendedor?.username} com ${estrelas} estrelas.`);
    }
};