import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
} from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_painel')
        .setDescription('Envia o painel fixo de atendimento (Botões)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setColor('DarkVividPink') // Cor de destaque
            .setTitle('💎 Central de Atendimento e Vendas')
            .setDescription(`
Seja bem-vindo à nossa central!
Selecione uma das opções abaixo para prosseguir:

💰 **Anunciar Conta**
Inicia nosso assistente passo-a-passo para você vender sua conta com segurança.

🆘 **Suporte / Ajuda**
Tire dúvidas gerais sobre o servidor ou peça ajuda a um Staff.
            `)
            .setImage('https://i.imgur.com/AfFp7pu.png') // Seu banner
            .setFooter({ text: 'MineStore System' });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_painel_anunciar')
                .setLabel('Anunciar Conta')
                .setEmoji('💰')
                .setStyle(ButtonStyle.Success), // Botão Verde

            new ButtonBuilder()
                .setCustomId('btn_painel_ajuda')
                .setLabel('Suporte / Ajuda')
                .setEmoji('🆘')
                .setStyle(ButtonStyle.Primary) // Botão Azul
        );

        if (interaction.channel && 'send' in interaction.channel) {
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }
        await interaction.reply({ content: '✅ Painel de botões enviado!', ephemeral: true });
    }
};