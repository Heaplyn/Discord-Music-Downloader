import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import os from 'os';
import { exec } from 'child_process';
import { checkAuth } from '../../Layer1/key.js';

export const networkCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('network')
        .setDescription('Network diagnostics and information (Restricted).')
        .addSubcommand(sub => sub.setName('ip').setDescription('Show local and public IP addresses'))
        .addSubcommand(sub => sub.setName('ping').setDescription('Ping a host to check latency').addStringOption(opt => opt.setName('host').setDescription('Host to ping (default google.com)')))
        .addSubcommand(sub => sub.setName('mac').setDescription('Show network hardware MAC addresses'))
        .addSubcommand(sub => sub.setName('dns').setDescription('Flush Windows DNS resolver cache'))
        .addSubcommand(sub => sub.setName('wifi').setDescription('Show connected Wi-Fi info')),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'ip':
                await interaction.deferReply();
                const interfaces = os.networkInterfaces();
                let localIp = 'Unknown';
                for (const name of Object.keys(interfaces)) {
                    for (const net of interfaces[name]!) {
                        if (net.family === 'IPv4' && !net.internal) {
                            localIp = net.address;
                            break;
                        }
                    }
                }

                try {
                    const response = await fetch('https://api.ipify.org');
                    const publicIp = await response.text();
                    return interaction.editReply(`📍 **Local IP:** \`${localIp}\` | 🌍 **Public IP:** \`${publicIp}\``);
                } catch (e) {
                    return interaction.editReply(`📍 **Local IP:** \`${localIp}\` | 🌍 **Public IP:** \`Fetch Failed\``);
                }

            case 'ping':
                const host = interaction.options.getString('host') || 'google.com';
                await interaction.reply(`📡 **Pinging ${host}...**`);
                exec(`ping -n 4 ${host}`, (err, stdout) => {
                    if (err) return interaction.editReply(`❌ **Ping to ${host} failed.**`);
                    return interaction.editReply(`\`\`\`\n${stdout}\n\`\`\``);
                });
                return;

            case 'mac':
                exec('getmac /v /fo list', (err, stdout) => {
                    if (err) return interaction.reply('❌ Failed to get MAC addresses.');
                    return interaction.reply(`\`\`\`\n${stdout}\n\`\`\``);
                });
                return;

            case 'dns':
                exec('ipconfig /flushdns', (err) => {
                    if (err) return interaction.reply('❌ Failed to flush DNS.');
                    return interaction.reply('⚡ **DNS Resolver Cache Flushed.**');
                });
                return;

            case 'wifi':
                exec('netsh wlan show interfaces', (err, stdout) => {
                    if (err) return interaction.reply('❌ Failed to get Wi-Fi info (or no Wi-Fi).');
                    return interaction.reply(`\`\`\`\n${stdout}\n\`\`\``);
                });
                return;
        }
    }
};
