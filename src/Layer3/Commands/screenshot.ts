import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { checkAuth } from '../../Layer1/key.js';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const screenshotCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Take a screenshot of the host PC (Restricted).'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        await interaction.deferReply();

        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const screenshotPath = path.join(tempDir, `screenshot_${Date.now()}.png`);

        try {
            // PowerShell script to take a screenshot
            const psScript = `
                Add-Type -AssemblyName System.Windows.Forms
                Add-Type -AssemblyName System.Drawing
                $Screen = [System.Windows.Forms.Screen]::PrimaryScreen
                $Width = $Screen.Bounds.Width
                $Height = $Screen.Bounds.Height
                $Top = $Screen.Bounds.Top
                $Left = $Screen.Bounds.Left
                $Bitmap = New-Object System.Drawing.Bitmap -ArgumentList $Width, $Height
                $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
                $Graphics.CopyFromScreen($Left, $Top, 0, 0, $Bitmap.Size)
                $Bitmap.Save('${screenshotPath}', [System.Drawing.Imaging.ImageFormat]::Png)
                $Graphics.Dispose()
                $Bitmap.Dispose()
            `;

            await execPromise(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);

            if (fs.existsSync(screenshotPath)) {
                const attachment = new AttachmentBuilder(screenshotPath, { name: 'screenshot.png' });
                await interaction.editReply({
                    content: '🖼️ **Host PC Screenshot:**',
                    files: [attachment]
                });

                fs.unlinkSync(screenshotPath);
            } else {
                throw new Error('Screenshot file not created.');
            }
        } catch (error) {
            console.error('Screenshot error:', error);
            await interaction.editReply('❌ Failed to capture screenshot.');
            if (fs.existsSync(screenshotPath)) fs.unlinkSync(screenshotPath);
        }
    }
};
