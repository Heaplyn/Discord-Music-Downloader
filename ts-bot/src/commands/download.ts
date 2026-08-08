
import { ChatInputCommandInteraction, 
    SlashCommandBuilder,
    AttachmentBuilder,
     Routes, 
     ApplicationIntegrationType, InteractionContextType 
 } from 'discord.js';
import { Command } from '../types/Command.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// 1. Convert exec into an async/await promise helper
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mb_conversion = 1024*1024;

function determine_limit(interaction: ChatInputCommandInteraction) {
    return 10;
}

async function compress_file(path:fs.PathLike,interaction:ChatInputCommandInteraction) {
    const filepath = fs.statSync(path)
    const size = filepath.size/mb_conversion;
    var limit = determine_limit(interaction);
        var application;
    if (size > limit) {
        const compressed_path = filepath.replace(/\.[^/.]+$/, "") + "_compressed.mp3";
        const ffmpegCmd = `ffmpeg -y -i "${filepath}" -b:a 128k "${compressed_path}"`;
        await execAsync(ffmpegCmd);
        path = compressed_path;
    } 
    application = new AttachmentBuilder(path);
    return application
}

export const downloadCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('download_music')
        .setDescription('Downloads music from a website using lucida.to')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to download')
                .setRequired(true)
        ).setContexts(
            InteractionContextType.Guild, 
            InteractionContextType.BotDM, 
            InteractionContextType.PrivateChannel
        )
        .setIntegrationTypes(
            ApplicationIntegrationType.GuildInstall, 
            ApplicationIntegrationType.UserInstall
        ),
        

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        let url = interaction.options.getString('url', true).trim();

        // (Your existing URL cleaning logic remains here)

        // 2. Resolve absolute path to your Python CLI file
        const cliPath = path.resolve(__dirname, '../../../src/layer1/lucida-flow/cli.py');

        try {
            await interaction.editReply(`📥 Running python scraper for link...`);

            // 3. Spawn the python subprocess and wait for it to finish
            const command = `python "${cliPath}" download "${url}"`;
            
            const { stdout, stderr } = await execAsync(command, {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    PYTHONIOENCODING: 'utf-8',
                    COLUMNS: '9999'
                }
            });

           const cleanStdout = stdout.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            // 2. Run the match on the clean text!
            const match = cleanStdout.match(/Saved to:\s*(.+)/);
            var filepath = match ? match[1].trim() : null;
            
            if (filepath && fs.existsSync(filepath)) {
                await interaction.editReply(`Uploading download...`);
                
                // 5. Send the file back to Discord!
                const attachment = await compress_file(filepath,interaction);
                
                await interaction.editReply({
                    content: 'Downloaded successfully! 🎵',
                    files: [attachment]
                });

                // Optional: Delete the local file to save space
                fs.unlinkSync(filepath);
            } else {
                console.error("Scraper stdout:", stdout);
                await interaction.editReply(`❌ Could not find downloaded file. Scraper output:\n\`\`\`${stdout.substring(0, 1000)}\`\`\``);
            }

        } catch (error: any) {
            const rawError = error.stderr || error.message;
            await interaction.editReply(`❌ Subprocess failed: ${rawError.substring(0, 1800)}`);
        }
    }
};