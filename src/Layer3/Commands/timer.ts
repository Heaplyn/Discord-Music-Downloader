import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const timerCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('timer')
        .setDescription('Set a simple timer.')
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes to wait').setRequired(true))
        .addStringOption(opt => opt.setName('label').setDescription('What is this timer for?')),

    async execute(interaction: ChatInputCommandInteraction) {
        const minutes = interaction.options.getInteger('minutes', true);
        const label = interaction.options.getString('label') || 'Timer';

        if (minutes <= 0) return interaction.reply({ content: '❌ Please enter a positive number of minutes.', ephemeral: true });

        await interaction.reply(`⏰ **Timer set for ${minutes} minutes:** ${label}`);

        setTimeout(() => {
            interaction.followUp({ content: `🔔 **TIME IS UP!** ${interaction.user}: Your timer for **${label}** has finished!` });
        }, minutes * 60000);
    }
};
