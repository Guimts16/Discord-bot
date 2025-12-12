import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChatInputCommandInteraction, 
    GuildMember, 
    EmbedBuilder, 
    TextChannel,
    ColorResolvable
} from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Sistema de Moderação Avançado')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // Só quem pode banir vê esse comando
        
        // Subcomando: BANIR
        .addSubcommand(sub => 
            sub.setName('ban')
                .setDescription('Banir um usuário permanentemente')
                .addUserOption(opt => opt.setName('usuario').setDescription('Quem será banido?').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Qual o motivo?').setRequired(false)))
        
        // Subcomando: EXPULSAR (KICK)
        .addSubcommand(sub => 
            sub.setName('kick')
                .setDescription('Expulsar um usuário (ele pode voltar)')
                .addUserOption(opt => opt.setName('usuario').setDescription('Quem será expulso?').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Qual o motivo?').setRequired(false)))

        // Subcomando: TIMEOUT (CASTIGO)
        .addSubcommand(sub => 
            sub.setName('timeout')
                .setDescription('Silenciar um usuário temporariamente')
                .addUserOption(opt => opt.setName('usuario').setDescription('Quem será silenciado?').setRequired(true))
                .addIntegerOption(opt => opt.setName('minutos').setDescription('Por quantos minutos?').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Qual o motivo?').setRequired(false))),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcomando = interaction.options.getSubcommand();
        const usuarioAlvo = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';
        const membroAlvo = await interaction.guild?.members.fetch(usuarioAlvo!.id).catch(() => null);

        // Validações de Segurança (Evitar erros bobos)
        if (!membroAlvo) {
            return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
        }
        
        if (usuarioAlvo!.id === interaction.user.id) {
            return interaction.reply({ content: '❌ Você não pode punir a si mesmo.', ephemeral: true });
        }

        if (!membroAlvo.bannable && !membroAlvo.manageable) {
            return interaction.reply({ content: '❌ Não consigo punir este usuário (ele tem um cargo maior que o meu ou é admin).', ephemeral: true });
        }

        // Execução das Punições
        try {
            let acaoRealizada = '';
            let corEmbed: ColorResolvable = 'Red';

            switch (subcomando) {
                case 'ban':
                    await membroAlvo.ban({ reason: motivo });
                    acaoRealizada = 'Banido';
                    corEmbed = 'DarkRed';
                    break;

                case 'kick':
                    await membroAlvo.kick(motivo);
                    acaoRealizada = 'Expulso';
                    corEmbed = 'Orange';
                    break;

                case 'timeout':
                    const minutos = interaction.options.getInteger('minutos') || 5;
                    // Converte minutos para milissegundos
                    await membroAlvo.timeout(minutos * 60 * 1000, motivo);
                    acaoRealizada = `Silenciado (${minutos} min)`;
                    corEmbed = 'Yellow';
                    break;
            }

            // Resposta para quem usou o comando
            await interaction.reply({ 
                content: `✅ **${usuarioAlvo?.tag}** foi **${acaoRealizada}** com sucesso.`, 
                ephemeral: true 
            });

            // LOG NO CANAL ESPECÍFICO
            const canalLogs = interaction.guild?.channels.cache.get(process.env.CANAL_LOGS_ID!) as TextChannel;
            if (canalLogs) {
                const logEmbed = new EmbedBuilder()
                    .setColor(corEmbed)
                    .setTitle(`⚖️ Punição Aplicada: ${acaoRealizada}`)
                    .addFields(
                        { name: '👤 Infrator', value: `${usuarioAlvo?.tag} (${usuarioAlvo?.id})`, inline: true },
                        { name: '👮 Staff', value: `${interaction.user.tag}`, inline: true },
                        { name: '📝 Motivo', value: motivo, inline: false }
                    )
                    .setTimestamp();
                
                await canalLogs.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao tentar aplicar a punição.', ephemeral: true });
        }
    }
};