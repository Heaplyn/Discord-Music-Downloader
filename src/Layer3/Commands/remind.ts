import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const remindCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder for later.')
        .addStringOption(opt => opt.setName('time').setDescription('Time to wait (e.g. 10m, 1h, 30s)').setRequired(true))
        .addStringOption(opt => opt.setName('task').setDescription('What to remind you about').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const timeStr = interaction.options.getString('time', true);
        const task = interaction.options.getString('task', true);

        const timeMatch = timeStr.match(/^(\d+)([smh])$/);
        if (!timeMatch) {
            return interaction.reply({ content: '❌ Invalid time format. Use something like `10m`, `1h`, or `30s`.', ephemeral: true });
        }

        const amount = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        let ms = amount * 1000;

        if (unit === 'm') ms *= 60;
        if (unit === 'h') ms *= 3600;

        if (ms > 24 * 3600 * 1000) {
            return interaction.reply({ content: '❌ Reminder cannot be longer than 24 hours.', ephemeral: true });
        }

        await interaction.reply(`✅ I will remind you about **${task}** in ${timeStr}.`);

        setTimeout(async () => {
            try {
                await interaction.user.send(`🔔 **REMINDER:** ${task}`);
            } catch (e) {
                if (interaction.channel && 'send' in interaction.channel) {
                    await (interaction.channel as any).send(`🔔 **REMINDER for ${interaction.user}:** ${task}`);
                }
            }
        }, ms);
    }
};
