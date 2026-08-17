import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const passwordCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Generate a random secure password.')
        .addIntegerOption(opt => 
            opt.setName('length')
               .setDescription('Length of the password (8-128, default: 16)')
               .setMinValue(8)
               .setMaxValue(128)
               .setRequired(false)
        )
        .addBooleanOption(opt => 
            opt.setName('special')
               .setDescription('Include special characters? (default: true)')
               .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const length = interaction.options.getInteger('length') ?? 16;
        const includeSpecial = interaction.options.getBoolean('special') ?? true;

        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

        let chars = uppercase + lowercase + numbers;
        if (includeSpecial) {
            chars += special;
        }

        let password = '';
        // Ensure we get at least one of each requested type for security
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        if (includeSpecial) {
            password += special[Math.floor(Math.random() * special.length)];
        }

        const currentLen = password.length;
        for (let i = 0; i < length - currentLen; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }

        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        await interaction.reply({
            content: `🔑 **Your Generated Password:**\n\`\`\`\n${password}\n\`\`\`\n*Keep this password secure and do not share it!*`,
            ephemeral: true
        });
    }
};
