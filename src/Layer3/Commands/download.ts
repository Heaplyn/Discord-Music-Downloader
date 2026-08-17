import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { LucidaClient } from '../../Layer2/lucida.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { YtDlp } from 'ytdlp-nodejs';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { checkAuth } from '../../Layer1/key.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadDir = path.resolve(__dirname, '../../../downloads');

interface DownloadResult {
    success: boolean;
    filepath?: string;
    size?: number;
    error?: string;
}

async function download_yt(url: string): Promise<DownloadResult> {
    try {
        const ytdlp = new YtDlp();

        // Execute the yt-dlp download with metadata and high quality
        const result = await ytdlp
            .download(url, {
                output: path.join(downloadDir, '%(title)s.%(ext)s'),
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: '0',
                noPlaylist: true
            })
            .run();

        const filepath = result.filePaths[0];

        if (filepath && fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            return {
                success: true,
                filepath: filepath,
                size: stats.size
            };
        } else {
            return {
                success: false,
                error: 'Download finished, but could not find the output file.'
            };
        }
    } catch (err: any) {
        return {
            success: false,
            error: err.message || err.toString()
        };
    }
}

async function download_lucida(url: string): Promise<DownloadResult> {
    console.log(`[Lucida] Initializing browser automation for: ${url}`);
    const client = new LucidaClient();
    return client.downloadTrack(url, downloadDir);
}


export const downloadCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('download_music')
        .setDescription('Downloads music from a website using lucida.to or yt-dlp')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to download (YouTube, SoundCloud, Tidal, Deezer, etc.)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        // 1. Defer reply to give the scraper up to 15 minutes of execution time
        await interaction.deferReply();

        let url: string = interaction.options.getString('url', true).trim();

        // 2. Extract and clean the URL parameter (removes leading/trailing text and spaces)
        const pos = url.indexOf('https://');
        if (pos !== -1) {
            const nextSpace = url.indexOf(' ', pos);
            if (nextSpace !== -1) {
                url = url.substring(pos, nextSpace).trim();
            } else {
                url = url.substring(pos).trim();
            }
        }

        console.log(`[Interaction] Starting download for: ${url}`);

        try {
            await interaction.editReply(`🔍 Analyzing link & bypassing Cloudflare...`);
            const cleanUrl = url.toLowerCase();

            // Routing logic (yt-dlp handles these domains best)
            const useYtDlp = cleanUrl.includes('youtube.com') ||
                             cleanUrl.includes('youtu.be') ||
                             cleanUrl.includes('youtube-nocookie.com') ||
                             cleanUrl.includes('soundcloud.com') ||
                             cleanUrl.includes('on.soundcloud.com') ||
                             cleanUrl.includes('snd.sc') ||
                             cleanUrl.includes('bandcamp.com');

            // 3. Download the track
            let result;
            if (useYtDlp) {
                result = await download_yt(url);
            } else {
                result = await download_lucida(url);
            }

            if (!result.success || !result.filepath) {
                throw new Error(result.error || 'Failed to download the track.');
            }

            const filepath = result.filepath;
            const filename = path.basename(filepath);

            // 4. Check the file size
            const stats = fs.statSync(filepath);
            const mbConversion = 1024 * 1024;
            const fileSizeMb = stats.size / mbConversion;

            // 5. If size exceeds Discord's 10MB limit, compress it
            if (fileSizeMb > 10) {
                await interaction.editReply(`🔄 File is too large (${fileSizeMb.toFixed(2)} MB). Compressing to 128kbps MP3...`);

                const compressedPath = filepath.replace(/\.[^/.]+$/, "") + "_compressed.mp3";
                const ffmpegCmd = `ffmpeg -y -i "${filepath}" -b:a 128k "${compressedPath}"`;

                try {
                    await execAsync(ffmpegCmd);

                    if (fs.existsSync(compressedPath)) {
                        const compStats = fs.statSync(compressedPath);
                        const compSizeMb = compStats.size / mbConversion;

                        await interaction.editReply(`Uploading compressed file...`);

                        const attachment = new AttachmentBuilder(compressedPath);
                        await interaction.editReply({
                            content: `Downloaded and compressed to ${compSizeMb.toFixed(2)} MB successfully! 🎵 \n Link: ${url}`,
                            files: [attachment]
                        });

                        // Clean up both files
                        fs.unlinkSync(filepath);
                        fs.unlinkSync(compressedPath);
                    } else {
                        throw new Error('FFmpeg failed to create the compressed file.');
                    }

                } catch (ffmpegErr: any) {
                    console.error('[FFmpeg Error] Compression failed:', ffmpegErr);
                    await interaction.editReply(`❌ Compression failed. Attempting fallback upload of original file...`);

                    const attachment = new AttachmentBuilder(filepath);
                    await interaction.editReply({
                        content: `Uploaded original file:`,
                        files: [attachment]
                    }).then(() => {
                        fs.unlinkSync(filepath);
                    }).catch(async (uploadErr) => {
                        fs.unlinkSync(filepath);
                        await interaction.editReply(`❌ Upload failed: File is too large (**${fileSizeMb.toFixed(2)} MB**).`);
                    });
                }
            } else {
                // Under 10MB: Upload the original high-quality file directly!
                await interaction.editReply(`Uploading ${filename} (${fileSizeMb.toFixed(2)} MB)...`);

                const attachment = new AttachmentBuilder(filepath);
                await interaction.editReply({
                    content: `Downloaded successfully! 🎵 \n Link: ${url}`,
                    files: [attachment]
                });

                // Clean up local file
                fs.unlinkSync(filepath);
            }

        } catch (error: any) {
            console.error(`[Error] Download command failed:`, error);
            const errorMsg = error.message || error;
            await interaction.editReply(`❌ Download failed: ${errorMsg.toString().substring(0, 1800)}`);
        }
    }
};
