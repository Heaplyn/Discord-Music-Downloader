import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import os from 'os';
import { exec } from 'child_process';
import { checkAuth } from '../../Layer1/key.js';

export const systemCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('system')
        .setDescription('Host system management and information (Restricted).')
        .addSubcommand(sub => sub.setName('uptime').setDescription('Show host PC uptime'))
        .addSubcommand(sub => sub.setName('whoami').setDescription('Show current system user'))
        .addSubcommand(sub => sub.setName('battery').setDescription('Show battery status (if applicable)'))
        .addSubcommand(sub => sub.setName('trash').setDescription('Empty the system Recycle Bin'))
        .addSubcommand(sub => sub.setName('temp').setDescription('Clear system temp files'))
        .addSubcommand(sub => sub.setName('kill').setDescription('Kill a running process').addStringOption(opt => opt.setName('process').setDescription('Process name (e.g. notepad)').setRequired(true)))
        .addSubcommand(sub => sub.setName('lock').setDescription('Lock the host workstation')),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'uptime':
                const up = Math.floor(os.uptime());
                const d = Math.floor(up / 86400);
                const h = Math.floor(up / 3600) % 24;
                const m = Math.floor(up / 60) % 60;
                return interaction.reply(`⏱️ **System Uptime:** ${d}d ${h}h ${m}m`);

            case 'whoami':
                return interaction.reply(`👤 **Current User:** \`${os.userInfo().username}\` on \`${os.hostname()}\``);

            case 'battery':
                // Note: Getting battery status in Node is OS-specific and usually requires a library.
                // We'll use a simple approach for Windows as Jarvis is Windows-based.
                exec('WMIC Path Win32_Battery Get EstimatedChargeRemaining', (err, stdout) => {
                    if (err || !stdout.includes('\n')) return interaction.reply('🔋 **Battery Status:** Unknown or No Battery.');
                    const charge = stdout.split('\n')[1].trim();
                    return interaction.reply(`🔋 **Battery Charge:** ${charge}%`);
                });
                return;

            case 'trash':
                // Windows-specific command to empty recycle bin
                exec('powershell.exe -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', (err) => {
                    if (err) return interaction.reply({ content: '❌ Failed to empty Recycle Bin.', ephemeral: true });
                    return interaction.reply('🗑️ **Recycle Bin Emptied.**');
                });
                return;

            case 'temp':
                exec('powershell.exe -Command "Remove-Item $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue"', (err) => {
                    return interaction.reply('🧹 **Temp Files Purged (where possible).**');
                });
                return;

            case 'kill':
                const procName = interaction.options.getString('process', true);
                exec(`taskkill /F /IM ${procName}.exe`, (err) => {
                    if (err) return interaction.reply({ content: `❌ Failed to kill process: ${procName}`, ephemeral: true });
                    return interaction.reply(`✅ **Terminated:** ${procName}`);
                });
                return;

            case 'lock':
                exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
                    if (err) return interaction.reply({ content: '❌ Failed to lock workstation.', ephemeral: true });
                    return interaction.reply('🔒 **Host Workstation Locked.**');
                });
                return;
        }
    }
};
