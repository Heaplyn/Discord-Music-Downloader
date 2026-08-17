import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import * as crypto from 'crypto';

export const hashCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('hash')
        .setDescription('Create a hash from some text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to hash')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('algorithm')
                .setDescription('Hash algorithm to use')
                .addChoices(
                    { name: 'MD5', value: 'md5' },
                    { name: 'SHA1', value: 'sha1' },
                    { name: 'SHA256', value: 'sha256' },
                    { name: 'SHA512', value: 'sha512' }
                )
        )
        .addStringOption(option =>
            option.setName('secret')
                .setDescription('Secret to use for an HMAC')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('text', true);
        const algorithm = interaction.options.getString('algorithm') || 'md5';
        const secret = interaction.options.getString('secret');

        let result: string;
        let title: string;

        if (secret) {
            result = crypto.createHmac(algorithm, secret).update(text).digest('hex');
            title = `${algorithm.toUpperCase()} HMAC`;
        } else {
            result = crypto.createHash(algorithm).update(text).digest('hex');
            title = `${algorithm.toUpperCase()} Hash`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(0x00AE86)
            .addFields(
                { name: 'Input', value: `\`\`\`${text}\`\`\`` },
                { name: 'Result', value: `\`\`\`${result}\`\`\`` }
            );

        if (secret) {
            embed.addFields({ name: 'Secret', value: `\`\`\`${secret}\`\`\`` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
