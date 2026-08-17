import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const qrcodeCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('qrcode')
        .setDescription('Generate a QR Code for text or a link.')
        .addStringOption(opt => opt.setName('text').setDescription('The text or URL to encode').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('text', true);

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

        const embed = new EmbedBuilder()
            .setTitle('📷 QR Code Generated')
            .setColor('#2c3e50')
            .setDescription(`Here is your QR Code for: \`${text.length > 50 ? text.slice(0, 47) + '...' : text}\``)
            .setImage(qrUrl)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
