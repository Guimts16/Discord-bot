import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { AccountManager } from '../../utils/AccountManager';

const accountManager = new AccountManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_estoque')
        .setDescription('Gestão administrativa do estoque')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('remover')
                .setDescription('Força a remoção de um anúncio')
                .addStringOption(opt => opt.setName('nick').setDescription('Nick da conta').setRequired(true))
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const nick = interaction.options.getString('nick')!;
        const conta = accountManager.getAccount(nick);

        if (!conta) {
            return interaction.reply({ content: '❌ Conta não encontrada no sistema.', ephemeral: true });
        }

        // Tenta apagar a mensagem visual
        try {
            const parts = conta.messageUrl.split('/');
            const channelId = parts[parts.length - 2];
            const messageId = parts[parts.length - 1];
            const canal = interaction.guild?.channels.cache.get(channelId) as TextChannel;
            if (canal) {
                const msg = await canal.messages.fetch(messageId).catch(() => null);
                if (msg) await msg.delete();
            }
        } catch (e) { console.log('Erro ao apagar mensagem visual (talvez já deletada).'); }

        // Apaga o arquivo
        accountManager.deleteAccount(nick);

        await interaction.reply({ content: `✅ **ADMIN:** O anúncio da conta **${conta.nick}** foi removido à força.` });
    }
};