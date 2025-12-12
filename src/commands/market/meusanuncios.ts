import { 
    SlashCommandBuilder, 
    CommandInteraction, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder, 
    ComponentType, 
    TextChannel, 
    MessageFlags 
} from 'discord.js';
import { AccountManager } from '../../utils/AccountManager';

const accountManager = new AccountManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meusanuncios')
        .setDescription('Gerencie e exclua seus anúncios ativos'),

    async execute(interaction: CommandInteraction) {
        const meusAnuncios = accountManager.getBySeller(interaction.user.id);

        if (meusAnuncios.length === 0) {
            return interaction.reply({ 
                content: '❌ Você não tem nenhum anúncio ativo no momento.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('select_delete_ad')
            .setPlaceholder('Selecione um anúncio para APAGAR')
            .addOptions(
                meusAnuncios.map(anuncio => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Nick: ${anuncio.nick}`)
                        .setDescription(`R$ ${anuncio.price} | Criado em: ${new Date(anuncio.createdAt).toLocaleDateString('pt-BR')}`)
                        .setValue(anuncio.nick)
                        .setEmoji('🗑️')
                )
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

        const response = await interaction.reply({
            content: `📂 **Painel de Gerenciamento**\nSelecione abaixo qual você deseja **EXCLUIR PERMANENTEMENTE**.`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return;
            const nickSelecionado = i.values[0];
            const conta = accountManager.getAccount(nickSelecionado);

            if (!conta) {
                await i.update({ content: '❌ Erro: Esse anúncio já não existe mais.', components: [] });
                return;
            }

            try {
                const parts = conta.messageUrl.split('/');
                const channelId = parts[parts.length - 2];
                const messageId = parts[parts.length - 1];

                const canal = interaction.guild?.channels.cache.get(channelId) as TextChannel;
                if (canal) {
                    const mensagemAnuncio = await canal.messages.fetch(messageId).catch(() => null);
                    if (mensagemAnuncio) await mensagemAnuncio.delete();
                }
            } catch (error) { console.log("Erro visual na exclusão."); }

            accountManager.deleteAccount(nickSelecionado);

            await i.update({ 
                content: `✅ **Sucesso!** A conta **${conta.nick}** foi removida.`, 
                components: [] 
            });
        });
    }
};