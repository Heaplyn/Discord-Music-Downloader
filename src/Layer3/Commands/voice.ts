import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { exec } from 'child_process';
import { checkAuth } from '../../Layer1/key.js';

export const voiceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Voice and TTS utilities (Restricted).')
        .addSubcommand(sub => sub.setName('speak').setDescription('Make the host PC speak text').addStringOption(opt => opt.setName('text').setDescription('Text to speak').setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'speak') {
            const text = interaction.options.getString('text', true);
            // Use PowerShell for simple TTS on Windows
            const psCommand = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('${text.replace(/'/g, "''")}')`;
            exec(`powershell -Command "${psCommand}"`, (err) => {
                if (err) return interaction.reply({ content: '❌ Failed to speak text.', ephemeral: true });
                return interaction.reply(`🗣️ **Speaking on Host:** "${text}"`);
            });
        }
    }
};
