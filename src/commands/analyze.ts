import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    AttachmentBuilder,
    InteractionContextType
} from 'discord.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Command } from '../types/Command.js';

const execFilePromise = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LoudnessResult {
    lufs: number;
    peak: number;
}

function getLoudness(filePath: string): Promise<LoudnessResult> {
    return new Promise((resolve, reject) => {
        execFile("ffmpeg", ["-i", filePath, "-af", "ebur128=peak=true", "-f", "null", "-"], (_, __, stderr) => {
            if (!stderr) return reject(new Error("no output from ffmpeg ???"));

            const lufsMatch = stderr.match(/Integrated loudness[\s\S]*?I:\s+([-\d.]+) LUFS/);
            const peakMatch = stderr.match(/Peak:\s+([-\d.]+) dBFS/);

            resolve({
                lufs: lufsMatch ? parseFloat(lufsMatch[1]) : NaN,
                peak: peakMatch ? parseFloat(peakMatch[1]) : NaN,
            });
        });
    });
}

export const analyzeCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('analyze')
        .setDescription('gives audio file info')
        .addAttachmentOption((option) =>
            option.setName('file')
                .setDescription('audio file to analyze')
                .setRequired(true)
        ) as any,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment('file', true);
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const timestamp = Date.now();
        const originalExt = path.extname(attachment.name) || `.mp3`;
        const inputPath = path.join(tempDir, `input_${timestamp}${originalExt}`);
        const waveformPath = path.join(tempDir, `waveform_analyze_${timestamp}.png`);

        try {
            await interaction.editReply('downloading file...');
            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

            await interaction.editReply('analyzing...');
            const [probeResult, loudness] = await Promise.all([
                execFilePromise("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inputPath]),
                getLoudness(inputPath),
            ]);

            const data = JSON.parse(probeResult.stdout);
            const fmt = data.format;
            const stream = data.streams.find((s: any) => s.codec_type === "audio");

            const waveformSize = "1920x660";
            const peakColor = "3232C8";
            const rmsColor = "6464DC";

            await execFilePromise("ffmpeg", [
                "-i", inputPath,
                "-filter_complex", `[0:a]showwavespic=s=${waveformSize}:colors=${peakColor}:filter=peak:split_channels=1[peaks];[0:a]showwavespic=s=${waveformSize}:colors=${rmsColor}:filter=average:split_channels=1[rms];[peaks][rms]overlay`,
                "-update", "1", waveformPath
            ]);

            const duration = parseFloat(fmt.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);

            await interaction.editReply({
                content: `processed file \`${attachment.name}\`\nduration: ${minutes}:${seconds.toString().padStart(2, "0")}\nbitrate: ${Math.round(fmt.bit_rate / 1000)} kbps\nsample rate: ${stream.sample_rate}hz\nintegrated: ${loudness.lufs} LUFS\npeak: ${loudness.peak} dBFS`,
                files: [new AttachmentBuilder(waveformPath, { name: "waveform.png" })]
            });

            // Cleanup
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(waveformPath)) fs.unlinkSync(waveformPath);

        } catch (error: any) {
            console.error("Analysis failed:", error);
            await interaction.editReply(`Error analyzing file: ${error.message}`);

            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(waveformPath)) fs.unlinkSync(waveformPath);
        }
    }
};
