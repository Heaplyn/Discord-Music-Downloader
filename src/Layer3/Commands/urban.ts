import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const urbanCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Search the Urban Dictionary')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The term to search for')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const query = interaction.options.getString('query', true);
        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`);
            const data = await response.json() as any;

            if (!data.list || data.list.length === 0) {
                await interaction.editReply(`No definitions found for \`${query}\`.`);
                return;
            }

            const result = data.list[0];
            const clean = (str: string) => str.replace(/\[|\]/g, '');

            const embed = new EmbedBuilder()
                .setTitle(result.word)
                .setURL(result.permalink)
                .setColor(0xEFF000)
                .setDescription(clean(result.definition).slice(0, 4096))
                .addFields(
                    { name: 'Example', value: clean(result.example).slice(0, 1024) || 'None' },
                    { name: 'Rating', value: `👍 ${result.thumbs_up} | 👎 ${result.thumbs_down}` }
                )
                .setFooter({ text: `Author: ${result.author}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Urban Dictionary error:', error);
            await interaction.editReply('There was an error fetching from Urban Dictionary.');
        }
    }
};
