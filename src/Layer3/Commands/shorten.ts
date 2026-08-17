import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const shortenCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('shorten')
        .setDescription('Shorten a URL using TinyURL.')
        .addStringOption(opt => opt.setName('url').setDescription('The URL to shorten').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            await interaction.reply({ content: '❌ Invalid URL. Please provide a complete URL starting with http:// or https://', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        try {
            const response = await fetch(`https://tinyurl.com/api-create?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`TinyURL responded with status ${response.status}`);
            }

            const shortUrl = await response.text();
            await interaction.editReply(`🔗 Here is your shortened URL:\n**${shortUrl}**`);
        } catch (error) {
            console.error('Shorten error:', error);
            await interaction.editReply('❌ Failed to shorten the URL. Try again later.');
        }
    }
};
