import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const mathCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('math')
        .setDescription('Perform mathematical calculations.')
        .addStringOption(option =>
            option.setName('expression')
                .setDescription('The math expression to evaluate (e.g. 2 + 2 * 4)')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const expression = interaction.options.getString('expression', true);

        // Safety check: only allow numbers and basic operators
        const safeRegex = /^[0-9\s\+\-\*\/\(\)\.]+$/;
        if (!safeRegex.test(expression)) {
            return interaction.reply({ content: '❌ Invalid expression. Only numbers and basic operators (+, -, *, /, (, )) are allowed.', ephemeral: true });
        }

        try {
            // Using Function constructor as a safer alternative to eval for simple math
            // Note: In a production bot, a proper math parser like mathjs is recommended.
            const result = new Function(`return ${expression}`)();

            if (result === undefined || result === null || isNaN(result)) {
                return interaction.reply({ content: '❌ Could not calculate a valid result.', ephemeral: true });
            }

            await interaction.reply(`🧮 **Result:** \`${expression} = ${result}\``);
        } catch (error) {
            await interaction.reply({ content: '❌ Error evaluating expression. Please check your syntax.', ephemeral: true });
        }
    }
};
