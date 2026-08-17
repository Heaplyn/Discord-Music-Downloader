import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import os from 'os';

export const sysinfoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('sysinfo')
        .setDescription('Displays system information of the bot host.'),

    async execute(interaction: ChatInputCommandInteraction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
        const freeMemory = os.freemem() / 1024 / 1024 / 1024;

        const embed = new EmbedBuilder()
            .setTitle('🖥️ Jarvis System Information')
            .setColor('#0099ff')
            .addFields(
                { name: 'OS', value: `${os.type()} ${os.release()} (${os.arch()})`, inline: true },
                { name: 'CPU', value: `${os.cpus()[0].model} (${os.cpus().length} cores)`, inline: false },
                { name: 'RAM', value: `${(totalMemory - freeMemory).toFixed(2)} GB / ${totalMemory.toFixed(2)} GB`, inline: true },
                { name: 'Bot Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: 'Heap Usage', value: `${memoryUsage.toFixed(2)} MB`, inline: true },
                { name: 'Node Version', value: process.version, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Jarvis Module' });

        await interaction.reply({ embeds: [embed] });
    }
};
