import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const helpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of all available commands.'),

    async execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Jarvis Music Downloader - Help Center')
            .setColor('#7289da')
            .setDescription('Here are the available commands you can use:')
            .addFields(
                { name: '/download <url>', value: 'Download music from various sources.' },
                { name: '/list', value: 'List and select downloaded tracks.' },
                { name: '/translate <text> <to>', value: 'Translate text between languages.' },
                { name: '/weather <city>', value: 'Get current weather info.' },
                { name: '/remind <time> <task>', value: 'Set a DM reminder (e.g. 10m).' },
                { name: '/math <expr>', value: 'Calculate math expressions.' },
                { name: '/todo', value: 'Manage personal task list.' },
                { name: '/sysinfo', value: 'View host system specs.' },
                { name: '/system', value: 'PC controls (Restricted: lock, trash, etc.)' },
                { name: '/power', value: 'Power management (Restricted: shutdown, reboot)' },
                { name: '/screenshot', value: 'Capture host screen (Restricted).' },
                { name: '/network', value: 'Network diagnostics (Restricted).' },
                { name: '/voice speak <text>', value: 'Host PC text-to-speech (Restricted).' },
                { name: '/whitelist <user>', value: 'Whitelist a user (Owner only).' }
            )
            .setFooter({ text: 'Powered by Jarvis Engine' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
