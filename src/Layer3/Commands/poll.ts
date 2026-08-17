import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const pollCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a simple yes/no poll.')
        .addStringOption(opt => opt.setName('question').setDescription('The question to poll').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const question = interaction.options.getString('question', true);

        const embed = new EmbedBuilder()
            .setTitle('📊 New Poll')
            .setDescription(question)
            .setColor('#5865F2')
            .setFooter({ text: `Asked by ${interaction.user.username}` })
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('✅');
        await message.react('❌');
    }
};
