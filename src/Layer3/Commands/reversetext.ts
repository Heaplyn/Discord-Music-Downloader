import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const reversetextCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('reversetext')
        .setDescription('Reverse some text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to reverse')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('text', true);
        const reversed = text.split('').reverse().join('');
        await interaction.reply(reversed);
    }
};
