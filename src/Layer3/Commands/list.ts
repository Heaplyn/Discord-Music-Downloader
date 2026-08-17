import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAuth } from '../../Layer1/key.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.resolve(__dirname, '../../../downloads');

export const listCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all downloaded tracks and select one to receive the file.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        if (!fs.existsSync(downloadsDir)) {
            return interaction.reply({ content: '❌ Downloads directory not found.', ephemeral: true });
        }

        const files = fs.readdirSync(downloadsDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp3', '.flac', '.m4a', '.wav', '.ogg'].includes(ext);
            })
            .sort((a, b) => {
                const statA = fs.statSync(path.join(downloadsDir, a));
                const statB = fs.statSync(path.join(downloadsDir, b));
                return statB.mtime.getTime() - statA.mtime.getTime(); // Newest first
            });

        if (files.length === 0) {
            return interaction.reply({ content: '📭 No tracks found in the downloads folder.', ephemeral: true });
        }

        // Discord limits select menus to 25 options
        const topFiles = files.slice(0, 25);

        const select = new StringSelectMenuBuilder()
            .setCustomId('select_track')
            .setPlaceholder('Choose a track to download...')
            .addOptions(
                topFiles.map(file => {
                    const label = file.length > 100 ? file.substring(0, 97) + '...' : file;
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(label)
                        .setValue(file);
                })
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

        const response = await interaction.reply({
            content: `🎵 Found ${files.length} tracks. Showing the latest 25:`,
            components: [row],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000 // 1 minute timeout
        });

        collector.on('collect', async i => {
            const fileName = i.values[0];
            const filePath = path.join(downloadsDir, fileName);

            if (!fs.existsSync(filePath)) {
                return i.reply({ content: '❌ File no longer exists.', ephemeral: true });
            }

            await i.deferReply({ ephemeral: true });

            try {
                await i.followUp({
                    content: `Here is your track: **${fileName}**`,
                    files: [filePath],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error sending file:', error);
                await i.followUp({ content: '❌ Failed to send the file. It might be too large for Discord.', ephemeral: true });
            }
        });

        collector.on('end', async () => {
            // Remove the select menu after timeout
            try {
                await interaction.editReply({ components: [] });
            } catch (e) {
                // Ignore errors if message was deleted
            }
        });
    }
};
