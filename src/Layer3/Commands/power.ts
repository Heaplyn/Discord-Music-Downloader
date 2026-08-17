import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { exec } from 'child_process';
import { checkAuth } from '../../Layer1/key.js';

export const powerCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('power')
        .setDescription('System power management (Restricted).')
        .addSubcommand(sub => sub.setName('shutdown').setDescription('Shut down the host PC').addIntegerOption(opt => opt.setName('delay').setDescription('Delay in seconds (default 60)')))
        .addSubcommand(sub => sub.setName('reboot').setDescription('Reboot the host PC'))
        .addSubcommand(sub => sub.setName('abort').setDescription('Abort any pending shutdown/reboot')),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'shutdown':
                const delay = interaction.options.getInteger('delay') || 60;
                exec(`shutdown /s /t ${delay}`, (err) => {
                    if (err) return interaction.reply({ content: '❌ Failed to schedule shutdown.', ephemeral: true });
                    return interaction.reply(`⚠️ **System Shutdown Scheduled in ${delay} seconds.**`);
                });
                return;

            case 'reboot':
                exec('shutdown /r /t 60', (err) => {
                    if (err) return interaction.reply({ content: '❌ Failed to schedule reboot.', ephemeral: true });
                    return interaction.reply('⚠️ **System Reboot Scheduled in 60 seconds.**');
                });
                return;

            case 'abort':
                exec('shutdown /a', (err) => {
                    if (err) return interaction.reply({ content: '❌ No pending shutdown to abort or failed.', ephemeral: true });
                    return interaction.reply('✅ **System Shutdown/Reboot Aborted.**');
                });
                return;
        }
    }
};
