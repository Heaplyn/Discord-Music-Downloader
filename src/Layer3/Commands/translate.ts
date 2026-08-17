import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const translateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text to another language.')
        .addStringOption(opt => opt.setName('text').setDescription('The text to translate').setRequired(true))
        .addStringOption(opt => opt.setName('to').setDescription('The language to translate to (e.g. en, es, fr, ja)').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('text', true);
        const to = interaction.options.getString('to', true);

        await interaction.deferReply();

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json() as any;

            const translatedText = data[0].map((s: any) => s[0]).join('');

            const embed = new EmbedBuilder()
                .setTitle('🌍 Translation')
                .setColor('#5865F2')
                .addFields(
                    { name: 'Original', value: text },
                    { name: `Translated (${to})`, value: translatedText }
                )
                .setFooter({ text: 'Google Translate' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Translation error:', error);
            await interaction.editReply('❌ Failed to translate text. Make sure the language code is valid.');
        }
    }
};
