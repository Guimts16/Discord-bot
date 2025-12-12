import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { CouponManager } from '../../utils/cuponsManager';

const couponManager = new CouponManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cupom')
        .setDescription('Gerenciar cupons')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Subcomando: CRIAR
        .addSubcommand(sub => 
            sub.setName('criar')
                .setDescription('Cria um novo cupom de desconto')
                // CORREÇÃO: Adicionado .setDescription() em todas as opções abaixo
                .addStringOption(o => o.setName('codigo').setDescription('O código do cupom (ex: NATAL10)').setRequired(true))
                .addIntegerOption(o => o.setName('porcentagem').setDescription('Porcentagem de desconto (1-100)').setRequired(true))
        )
        // Subcomando: APLICAR
        .addSubcommand(sub => 
            sub.setName('aplicar')
                .setDescription('Testa e calcula o desconto num valor')
                // CORREÇÃO: Adicionado .setDescription() em todas as opções abaixo
                .addStringOption(o => o.setName('codigo').setDescription('O código do cupom').setRequired(true))
                .addNumberOption(o => o.setName('valor_original').setDescription('O valor original para testar o desconto').setRequired(true))
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'criar') {
            const codigo = interaction.options.getString('codigo')!;
            const pct = interaction.options.getInteger('porcentagem')!;
            
            // Pequena validação extra
            if (pct <= 0 || pct > 100) {
                return interaction.reply({ content: '❌ A porcentagem deve ser entre 1 e 100.', ephemeral: true });
            }

            couponManager.create(codigo, pct);
            await interaction.reply(`✅ Cupom **${codigo.toUpperCase()}** criado com **${pct}%** de desconto.`);
        }

        if (sub === 'aplicar') {
            const codigo = interaction.options.getString('codigo')!;
            const valor = interaction.options.getNumber('valor_original')!;
            const desconto = couponManager.use(codigo);

            if (desconto) {
                const final = valor - (valor * (desconto / 100));
                await interaction.reply(`💸 Cupom Válido! De R$ ${valor} por **R$ ${final.toFixed(2)}**.`);
            } else {
                await interaction.reply('❌ Cupom inválido ou não encontrado.');
            }
        }
    }
};