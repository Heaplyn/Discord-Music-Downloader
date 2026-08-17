import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! 🏓'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Pong! TypeScript edition! 🏓');
    }
};
