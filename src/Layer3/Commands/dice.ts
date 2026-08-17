import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const diceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll some dice')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of dice to roll')
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addIntegerOption(option =>
            option.setName('sides')
                .setDescription('Number of sides on each die')
                .setMinValue(2)
                .setMaxValue(100)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const amount = interaction.options.getInteger('amount') || 1;
        const sides = interaction.options.getInteger('sides') || 6;

        const rolls = [];
        for (let i = 0; i < amount; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }

        const total = rolls.reduce((a, b) => a + b, 0);

        if (amount === 1) {
            await interaction.reply(`🎲 You rolled a **${total}** (1d${sides})`);
        } else {
            await interaction.reply(`🎲 You rolled: ${rolls.join(', ')} (**Total: ${total}**) (${amount}d${sides})`);
        }
    }
};
