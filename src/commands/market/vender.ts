import { 
    SlashCommandBuilder, 
    CommandInteraction, 
    TextChannel, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType, 
    ChannelType,
    Message,
    MessageFlags,
    Attachment
} from 'discord.js';
import { AccountManager } from '../../utils/AccountManager';

const accountManager = new AccountManager();

interface AnuncioData {
    nick: string;
    preco: string;
    descricao: string;
    vips: string;
    imagens: string[];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anunciar')
        .setDescription('Cria um anúncio passo-a-passo e salva no estoque'),

    async execute(interaction: CommandInteraction) {
        if (!interaction.guild) return;
        const channel = interaction.channel as TextChannel;

        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Use este comando em um canal de texto normal.', flags: MessageFlags.Ephemeral });
        }

        await interaction.reply({ content: '🔄 Abrindo assistente seguro...', flags: MessageFlags.Ephemeral });

        const thread = await channel.threads.create({
            name: `venda-${interaction.user.username}`,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            invitable: false
        });

        await thread.members.add(interaction.user.id);
        await thread.send(`👋 Olá <@${interaction.user.id}>! Vamos cadastrar a conta.\nUse os botões ou digite para responder.`);

        const dados: AnuncioData = { nick: '', preco: '', descricao: '', vips: '', imagens: [] };
        
        const passos = [
            { id: 'nick', texto: '👤 **Passo 1/5: Qual o Nick da conta?**' },
            { id: 'preco', texto: '💰 **Passo 2/5: Qual o Valor?** (Apenas números)' },
            { id: 'descricao', texto: '📜 **Passo 3/5: Histórico de Punições**' },
            { id: 'vips', texto: '💎 **Passo 4/5: Ranks e Vantagens**' },
            { id: 'imagens', texto: '📸 **Passo 5/5: Prints da Conta** (Envie imagem ou pule)' }
        ];

        let indicePasso = 0;

        const enviarPergunta = async (index: number, erro?: string) => {
            const row = new ActionRowBuilder<ButtonBuilder>();
            if (index > 0) row.addComponents(new ButtonBuilder().setCustomId('voltar').setLabel('⬅️ Voltar').setStyle(ButtonStyle.Secondary));
            row.addComponents(new ButtonBuilder().setCustomId('cancelar').setLabel('❌ Cancelar').setStyle(ButtonStyle.Danger));
            if (passos[index].id === 'imagens') row.addComponents(new ButtonBuilder().setCustomId('pular_img').setLabel('⏩ Pular Imagem').setStyle(ButtonStyle.Primary));

            let conteudo = passos[index].texto;
            if (erro) conteudo = `⚠️ **Atenção:** ${erro}\n\n${conteudo}`;

            await thread.send({ content: conteudo, components: [row] });
        };

        await enviarPergunta(0);

        const collector = thread.createMessageCollector({
            filter: (m) => m.author.id === interaction.user.id,
            idle: 600000
        });

        const buttonCollector = thread.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === interaction.user.id,
            idle: 600000
        });

        buttonCollector.on('collect', async (i) => {
            if (['postar_final', 'cancelar_final', 'edit_nick'].some(id => i.customId.startsWith(id))) return;
            try { await i.deferUpdate(); } catch (e) { return; }

            if (i.customId === 'cancelar') {
                collector.stop('cancelado');
                return;
            }
            if (i.customId === 'voltar' && indicePasso > 0) {
                indicePasso--;
                await thread.send('↩️ **Voltando...**');
                await enviarPergunta(indicePasso);
            }
            if (i.customId === 'pular_img') {
                dados.imagens = [];
                indicePasso++;
                collector.stop('finalizado');
            }
        });

        collector.on('collect', async (message: Message) => {
            const texto = message.content.trim();
            const passoAtual = passos[indicePasso];

            if (texto.toLowerCase() === 'cancelar') { collector.stop('cancelado'); return; }

            if (passoAtual.id === 'preco') {
                if (!/^[0-9.,R$\s]+$/.test(texto)) {
                    await enviarPergunta(indicePasso, 'Use apenas números (ex: 50,00).');
                    return;
                }
                dados.preco = texto.replace('R$', '').trim();
            } else if (passoAtual.id === 'imagens') {
                 if (message.attachments.size > 0) {
                    message.attachments.forEach((att: Attachment) => dados.imagens.push(att.url));
                } else if (texto.startsWith('http')) {
                    dados.imagens.push(texto);
                } else if (texto.toLowerCase() !== 'pular') {
                    await enviarPergunta(indicePasso, 'Envie uma imagem ou clique em Pular.');
                    return;
                }
            } else {
                if (passoAtual.id === 'nick') dados.nick = texto;
                if (passoAtual.id === 'descricao') dados.descricao = texto;
                if (passoAtual.id === 'vips') dados.vips = texto;
            }

            indicePasso++;
            if (indicePasso < passos.length) {
                await enviarPergunta(indicePasso);
            } else {
                collector.stop('finalizado');
            }
        });

        collector.on('end', async (_, reason) => {
            buttonCollector.stop(); 

            if (reason === 'cancelado') {
                await thread.send('🗑️ Cancelado.');
                setTimeout(() => thread.delete(), 3000);
                return;
            }

            if (reason === 'finalizado') {
                const gerarPreview = () => {
                    const skinCorpo = `https://visage.surgeplay.com/full/512/${dados.nick}`;
                    const imagemFinal = dados.imagens.length > 0 ? dados.imagens[0] : skinCorpo;

                    return new EmbedBuilder()
                        .setColor('#9b59b6')
                        .setTitle(`Revisão: ${dados.nick}`)
                        .setDescription(`**Nick:** ${dados.nick}\n**Valor:** R$ ${dados.preco}\n\n**Histórico:**\n${dados.descricao}\n\n**Vips:**\n${dados.vips}`)
                        .setImage(imagemFinal);
                };

                const msgPreview = await thread.send({ 
                    content: '✨ **Confira seu anúncio:**',
                    embeds: [gerarPreview()],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('postar_final').setLabel('✅ POSTAR AGORA').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('cancelar_final').setLabel('🗑️ Cancelar').setStyle(ButtonStyle.Danger)
                        )
                    ]
                });

                const reviewCollector = msgPreview.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 600000
                });

                reviewCollector.on('collect', async (i) => {
                    if (i.user.id !== interaction.user.id) return;
                    try { await i.deferUpdate(); } catch (e) { }

                    if (i.customId === 'postar_final') {
                        const canalVendas = interaction.guild?.channels.cache.get(process.env.CANAL_VENDAS_ID!) as TextChannel;
                        
                        const embedFinal = gerarPreview();
                        embedFinal.setTitle(null); 
                        embedFinal.setAuthor({ name: 'Succubos Store', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
                        embedFinal.setFooter({ text: `VendedorID: ${interaction.user.id} | INFO_IA: ${dados.vips}` });
                        
                        embedFinal.setDescription(`
**• Nick:** ${dados.nick}
**• NameMC:** [Clique aqui](https://pt.namemc.com/profile/${dados.nick})
**• Bans:** ${dados.descricao}
**• Vips/Tags:** ${dados.vips}
**• Valor:** R$ ${dados.preco}

## ${dados.nick.toUpperCase()}`);

                        const btnCompra = new ButtonBuilder().setCustomId('comprar_btn').setLabel('Tenho interesse!').setEmoji('🎯').setStyle(ButtonStyle.Success);

                        if (canalVendas) {
                            const msgEnviada = await canalVendas.send({ 
                                embeds: [embedFinal], 
                                components: [new ActionRowBuilder<ButtonBuilder>().addComponents(btnCompra)] 
                            });

                            accountManager.saveAccount({
                                id: Date.now().toString(),
                                nick: dados.nick,
                                price: dados.preco,
                                description: dados.descricao,
                                vips: dados.vips,
                                cosmetics: '',
                                wins: '',
                                images: dados.imagens,
                                sellerId: interaction.user.id,
                                messageUrl: msgEnviada.url,
                                status: 'DISPONIVEL',
                                createdAt: new Date().toISOString()
                            });

                            await i.editReply({ content: '✅ **Postado e Salvo!**', components: [], embeds: [] });
                            setTimeout(() => thread.delete(), 4000);
                        }
                        reviewCollector.stop();
                    } else if (i.customId === 'cancelar_final') {
                        await i.editReply({ content: '❌ Cancelado.', components: [], embeds: [] });
                        reviewCollector.stop();
                        setTimeout(() => thread.delete(), 3000);
                    }
                });
            }
        });
    }
};