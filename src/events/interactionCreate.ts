import {
  Events,
  Interaction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  MessageFlags,
  ComponentType,
} from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import { AccountManager } from "../utils/AccountManager";
import { logger } from "../utils/LogManager";
import { WishlistManager } from "../utils/WishlistManager"; // Importe caso tenha criado

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    const client = interaction.client as ExtendedClient;

    // 1. LOG DE COMANDOS /
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) {
        logger.cmd(`${interaction.user.tag} usou /${interaction.commandName}`);
        try {
          await command.execute(interaction);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. LOG DE BOTÕES DO PAINEL E SISTEMA
    if (interaction.isButton()) {
      // --- BOTÃO: ANUNCIAR (ABRE O WIZARD) ---
      if (interaction.customId === "btn_painel_anunciar") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = await interaction.guild?.channels.create({
          name: `venda-${interaction.user.username}`,
          type: ChannelType.GuildText,
          topic: `WIZARD DE VENDA - ${interaction.user.id}`,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
              ],
            },
          ],
        });

        if (channel) {
          await interaction.editReply(
            `✅ **Atendimento Iniciado!** Vá para ${channel} para criar seu anúncio.`
          );
          // Chama a função do Wizard (definida lá embaixo)
          iniciarWizardDeVenda(channel, interaction.user);
        } else {
          await interaction.editReply("❌ Erro ao criar canal de venda.");
        }
      }

      // --- BOTÃO: AJUDA (SUPORTE) ---
      if (interaction.customId === "btn_painel_ajuda") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const channel = await interaction.guild?.channels.create({
          name: `suporte-${interaction.user.username}`,
          type: ChannelType.GuildText,
          topic: `STATUS_IA: ON | TIPO: SUPORTE_GERAL`,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel],
            },
          ],
        });

        if (channel) {
          await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
              new EmbedBuilder()
                .setTitle("🆘 Suporte")
                .setDescription("Descreva sua dúvida. A IA está ativa.")
                .setColor("Blue"),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId("fechar_ticket")
                  .setLabel("🔒 Fechar")
                  .setStyle(ButtonStyle.Danger)
              ),
            ],
          });
          await interaction.editReply(`✅ Ticket criado: ${channel}`);
        }
      }

      // --- BOTÃO: COMPRAR (PUBLICADO NO CANAL DE VENDAS) ---
      if (interaction.customId === "comprar_btn") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Pega dados do footer
        const embed = interaction.message.embeds[0];
        const footer = embed.footer?.text || "";
        const vendedorId = footer
          .split(" | INFO_IA: ")[0]
          .replace("VendedorID: ", "");
        const infoExtra = footer.split(" | INFO_IA: ")[1] || "";
        const nickConta =
          embed.description?.split("\n")[1]?.replace("**Nick:** ", "") ||
          "Conta";

        if (interaction.user.id === vendedorId) {
          await interaction.editReply(
            "❌ Você não pode comprar seu próprio item."
          );
          return;
        }

        const channel = await interaction.guild?.channels.create({
          name: `compra-${interaction.user.username}`,
          type: ChannelType.GuildText,
          topic: `STATUS_IA: ON | PRODUTO: ${nickConta} | DETALHES: ${infoExtra}`,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel],
            },
            { id: vendedorId, allow: [PermissionFlagsBits.ViewChannel] },
          ],
        });

        if (channel) {
          await channel.send({
            content: `<@${interaction.user.id}> <@${vendedorId}>`,
            embeds: [
              new EmbedBuilder()
                .setTitle("🤝 Negociação")
                .setDescription(
                  `Interesse na conta **${nickConta}**.\nNegociem aqui com segurança.`
                )
                .setColor("Green"),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId("fechar_ticket")
                  .setLabel("🔒 Fechar")
                  .setStyle(ButtonStyle.Danger)
              ),
            ],
          });
          await interaction.editReply(`✅ Ticket de compra criado: ${channel}`);
          logger.sales(
            `Ticket de compra criado por ${interaction.user.tag} para ${nickConta}`
          );
        }
      }

      // --- BOTÃO: FECHAR TICKET ---
      if (interaction.customId === "fechar_ticket") {
        const channel = interaction.channel as TextChannel;
        await interaction.reply("🔒 Fechando em 5 segundos...");
        setTimeout(() => channel.delete().catch(() => {}), 5000);
      }
    }
  },
};

// ==========================================================
// FUNÇÃO WIZARD (LÓGICA CORRIGIDA E SEGURA)
// ==========================================================
async function iniciarWizardDeVenda(channel: TextChannel, user: any) {
  const dados = {
    nick: "",
    preco: "",
    descricao: "",
    vips: "",
    cosmeticos: "Nenhum",
    wins: "Nenhum",
    imagens: [] as string[],
  };

  const passos = [
    { id: "nick", txt: "1️⃣ **Qual o Nick da conta?**" },
    { id: "preco", txt: "2️⃣ **Qual o Valor?** (Ex: 50,00)" },
    { id: "desc", txt: "3️⃣ **Histórico de Punições?**" },
    { id: "vips", txt: "4️⃣ **Vips e Tags?**" },
    { id: "cosm", txt: '5️⃣ **Cosméticos?** (Digite "Nenhum" se não tiver)' },
    { id: "wins", txt: '6️⃣ **Wins/Stats?** (Digite "Nenhum" se não tiver)' },
    {
      id: "img",
      txt: "7️⃣ **Prints/Imagens** (Envie imagem aqui no chat ou clique em Pular)",
    },
  ];

  let indice = 0;

  // Função de Pergunta
  const ask = async (i: number) => {
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("wiz_cancel")
        .setLabel("Cancelar")
        .setStyle(ButtonStyle.Danger)
    );

    if (passos[i].id === "img") {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("wiz_skip")
          .setLabel("⏩ Pular Imagem")
          .setStyle(ButtonStyle.Primary)
      );
    }
    await channel.send({ content: passos[i].txt, components: [row] });
  };

  await channel.send(`👋 Olá <@${user.id}>! Vamos criar seu anúncio.`);
  await ask(0);

  // COLETORES DA FASE DE PERGUNTAS
  const msgCollector = channel.createMessageCollector({
    filter: (m) => m.author.id === user.id,
    idle: 600000,
  });
  const navCollector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === user.id,
    idle: 600000,
  });

  // Função para encerrar a fase de perguntas e iniciar a revisão
  const finalizarPerguntas = async () => {
    msgCollector.stop();
    navCollector.stop();
    await mostrarPainelFinal(channel, user, dados);
  };

  // --- LÓGICA DE NAVEGAÇÃO (BOTÕES) ---
  navCollector.on("collect", async (i) => {
    try {
      await i.deferUpdate();
    } catch {}

    if (i.customId === "wiz_cancel") {
      await channel.send("❌ Cancelado. Fechando canal...");
      setTimeout(() => channel.delete().catch(() => {}), 3000);
      msgCollector.stop();
      navCollector.stop();
      return;
    }

    if (i.customId === "wiz_skip") {
      dados.imagens = [];
      indice++;
      if (indice < passos.length) await ask(indice);
      else await finalizarPerguntas(); // FIM
    }
  });

  // --- LÓGICA DE TEXTO/IMAGEM ---
  msgCollector.on("collect", async (m) => {
    const txt = m.content.trim();
    if (txt.toLowerCase() === "cancelar") return; // Botão já trata

    const step = passos[indice];

    // Validação
    if (step.id === "preco" && !/^[0-9.,R$ ]+$/.test(txt)) {
      return channel.send(
        "⚠️ Formato inválido. Use apenas números (ex: 50,00)."
      );
    }

    // Salvar
    if (step.id === "nick") dados.nick = txt;
    if (step.id === "preco") dados.preco = txt;
    if (step.id === "desc") dados.descricao = txt;
    if (step.id === "vips") dados.vips = txt;
    if (step.id === "cosm") dados.cosmeticos = txt;
    if (step.id === "wins") dados.wins = txt;

    if (step.id === "img") {
      if (m.attachments.size > 0)
        m.attachments.forEach((a) => dados.imagens.push(a.url));
      else if (txt.startsWith("http")) dados.imagens.push(txt);
      else if (txt.toLowerCase() === "pular") dados.imagens = [];
      else return channel.send("⚠️ Envie uma imagem ou clique no botão Pular.");
    }

    indice++;
    if (indice < passos.length) await ask(indice);
    else await finalizarPerguntas(); // FIM
  });
}

// ==========================================================
// FUNÇÃO DE REVISÃO E POSTAGEM (ISOLADA)
// ==========================================================
async function mostrarPainelFinal(channel: TextChannel, user: any, dados: any) {
  const skin = `https://visage.surgeplay.com/full/512/${dados.nick}`;
  const img = dados.imagens.length > 0 ? dados.imagens[0] : skin;

  const embed = new EmbedBuilder()
    .setTitle("🔎 Revisão do Anúncio")
    .setColor("Gold")
    .setDescription(
      `**Nick:** ${dados.nick}\n**Valor:** ${dados.preco}\n**Bans:** ${dados.descricao}\n**Vips:** ${dados.vips}`
    )
    .setImage(img)
    .setFooter({ text: "Clique em POSTAR para publicar." });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("final_post")
      .setLabel("✅ POSTAR AGORA")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("final_cancel")
      .setLabel("🗑️ Cancelar")
      .setStyle(ButtonStyle.Danger)
  );

  const msgRevisao = await channel.send({
    content: "✨ **Tudo pronto! Confira:**",
    embeds: [embed],
    components: [row],
  });

  // NOVO COLETOR EXCLUSIVO PARA A POSTAGEM
  const finalCollector = msgRevisao.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === user.id,
    time: 600000, // 10 minutos para decidir
  });

  finalCollector.on("collect", async (i) => {
    try {
      await i.deferUpdate();
    } catch {}

    if (i.customId === "final_cancel") {
      await channel.send("❌ Cancelado.");
      setTimeout(() => channel.delete().catch(() => {}), 3000);
      finalCollector.stop();
      return;
    }

    if (i.customId === "final_post") {
      const canalVendas = channel.guild.channels.cache.get(
        process.env.CANAL_VENDAS_ID!
      ) as TextChannel;

      if (!canalVendas) {
        return channel.send(
          `❌ Erro Crítico: Canal de vendas (ID: ${process.env.CANAL_VENDAS_ID}) não encontrado.`
        );
      }

      // Cria o Embed Oficial
      const embedOficial = new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({
          name: "Nova Oferta",
          iconURL: "https://i.imgur.com/AfFp7pu.png",
        })
        .setDescription(
          `
**Nick:** ${dados.nick}
**NameMC:** [Clique Aqui](https://pt.namemc.com/profile/${dados.nick})
**Valor:** R$ ${dados.preco}

**Bans:** ${dados.descricao}
**Vips:** ${dados.vips}
**Cosméticos:** ${dados.cosmeticos}
**Wins:** ${dados.wins}

## ${dados.nick.toUpperCase()}`
        )
        .setImage(img)
        .setFooter({
          text: `VendedorID: ${user.id} | INFO_IA: ${dados.vips} ${dados.cosmeticos}`,
        });

      const btn = new ButtonBuilder()
        .setCustomId("comprar_btn")
        .setLabel("Tenho Interesse")
        .setEmoji("🎯")
        .setStyle(ButtonStyle.Success);

      const msgPublicada = await canalVendas.send({
        embeds: [embedOficial],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(btn)],
      });

      // Salva no Banco de Dados
      const accountManager = new AccountManager();
      accountManager.saveAccount({
        id: Date.now().toString(),
        nick: dados.nick,
        price: dados.preco,
        description: dados.descricao,
        vips: dados.vips,
        cosmetics: dados.cosmeticos,
        wins: dados.wins,
        images: dados.imagens,
        sellerId: user.id,
        messageUrl: msgPublicada.url,
        status: "DISPONIVEL",
        createdAt: new Date().toISOString(),
      });

      // Tenta avisar Wishlist (Se tiver)
      try {
        const { WishlistManager } = require("../utils/WishlistManager");
        const wm = new WishlistManager();
        const interessados = wm.checkMatches(
          dados.descricao + " " + dados.vips,
          ""
        );
        if (interessados.length > 0) {
          // Filtra o próprio vendedor
          const users = interessados.filter((id: string) => id !== user.id);
          if (users.length > 0) {
            const pings = users.map((id: string) => `<@${id}>`).join(" ");
            canalVendas
              .send(
                `🔔 **Wishlist:** ${pings}, corre que anunciaram o que você queria!`
              )
              .catch(() => {});
          }
        }
      } catch (e) {}

      logger.sales(`Venda postada: ${dados.nick} por ${user.tag}`);

      await channel.send(
        "✅ **Sucesso!** Anúncio publicado. Fechando canal..."
      );
      setTimeout(() => channel.delete().catch(() => {}), 4000);
      finalCollector.stop();
    }
  });
}
