import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    MessageFlags 
} from 'discord.js';
import { WishlistManager } from '../../utils/WishlistManager';

const wishlistManager = new WishlistManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avise')
        .setDescription('Me avise quando um item específico for anunciado')
        .addStringOption(opt => 
            opt.setName('termo')
                .setDescription('O que você procura? (Ex: MVP+, Lunar, Banido)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const termo = interaction.options.getString('termo')!;

        // Pequena validação para evitar spam de termos curtos demais
        if (termo.length < 3) {
            return interaction.reply({ 
                content: '❌ O termo deve ter pelo menos 3 letras.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Salva no JSON
        wishlistManager.add(interaction.user.id, termo);

        await interaction.reply({ 
            content: `✅ **Alerta Definido!**\nAssim que alguém anunciar uma conta contendo **"${termo}"**, eu vou te marcar no chat!`, 
            flags: MessageFlags.Ephemeral 
        });
    }
};