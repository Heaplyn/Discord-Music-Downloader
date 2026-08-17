import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const dictionaryCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('dictionary')
        .setDescription('Look up a word in the dictionary.')
        .addStringOption(opt => opt.setName('word').setDescription('The word to look up').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const word = interaction.options.getString('word', true);

        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (response.status === 404) {
                await interaction.editReply(`❌ Could not find definition for **${word}**.`);
                return;
            }

            const data = await response.json() as any;
            const entry = data[0];
            const meanings = entry.meanings || [];
            
            const embed = new EmbedBuilder()
                .setTitle(`📖 Dictionary: ${entry.word}`)
                .setColor('#3498db')
                .setTimestamp();

            if (entry.phonetic) {
                embed.setDescription(`*Phonetic: ${entry.phonetic}*`);
            }

            let defsText = '';
            for (const meaning of meanings.slice(0, 3)) { // Limit to 3 parts of speech
                const partOfSpeech = meaning.partOfSpeech;
                defsText += `**${partOfSpeech.toUpperCase()}**\n`;
                
                const definitions = meaning.definitions || [];
                for (const def of definitions.slice(0, 2)) { // Limit to 2 definitions per part of speech
                    defsText += `• ${def.definition}\n`;
                    if (def.example) {
                        defsText += `  *Example: "${def.example}"*\n`;
                    }
                }
                defsText += '\n';
            }

            embed.addFields({ name: 'Definitions', value: defsText.slice(0, 1024) || 'No definitions found.' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Dictionary error:', error);
            await interaction.editReply('❌ There was an error looking up that word.');
        }
    }
};
