import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const textCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('text')
        .setDescription('Various text processing utilities.')
        .addSubcommand(sub => sub.setName('upper').setDescription('Convert text to UPPERCASE').addStringOption(opt => opt.setName('input').setDescription('Text to convert').setRequired(true)))
        .addSubcommand(sub => sub.setName('lower').setDescription('Convert text to lowercase').addStringOption(opt => opt.setName('input').setDescription('Text to convert').setRequired(true)))
        .addSubcommand(sub => sub.setName('titlecase').setDescription('Convert text to Title Case').addStringOption(opt => opt.setName('input').setDescription('Text to convert').setRequired(true)))
        .addSubcommand(sub => sub.setName('reverse').setDescription('Reverse text').addStringOption(opt => opt.setName('input').setDescription('Text to reverse').setRequired(true)))
        .addSubcommand(sub => sub.setName('wordcount').setDescription('Count words and characters').addStringOption(opt => opt.setName('input').setDescription('Text to analyze').setRequired(true)))
        .addSubcommand(sub => sub.setName('base64').setDescription('Encode or decode Base64').addStringOption(opt => opt.setName('action').setDescription('Action to perform').setRequired(true).addChoices({name:'Encode', value:'encode'}, {name:'Decode', value:'decode'})).addStringOption(opt => opt.setName('input').setDescription('Text to process').setRequired(true)))
        .addSubcommand(sub => sub.setName('json').setDescription('Prettify JSON').addStringOption(opt => opt.setName('input').setDescription('JSON string').setRequired(true)))
        .addSubcommand(sub => sub.setName('lorem').setDescription('Generate Lorem Ipsum placeholder text').addIntegerOption(opt => opt.setName('words').setDescription('Number of words (default 20)')))
        .addSubcommand(sub => sub.setName('guid').setDescription('Generate a new GUID/UUID'))
        .addSubcommand(sub => sub.setName('unix').setDescription('Get current Unix timestamp')),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const input = interaction.options.getString('input') || '';

        switch (subcommand) {
            case 'upper':
                return interaction.reply(`\`\`\`\n${input.toUpperCase()}\n\`\`\``);
            case 'lower':
                return interaction.reply(`\`\`\`\n${input.toLowerCase()}\n\`\`\``);
            case 'titlecase':
                const tc = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                return interaction.reply(`\`\`\`\n${tc}\n\`\`\``);
            case 'reverse':
                return interaction.reply(`\`\`\`\n${input.split('').reverse().join('')}\n\`\`\``);
            case 'wordcount':
                const words = input.trim().split(/\s+/).length;
                const chars = input.length;
                return interaction.reply(`📊 **Word Count:** ${words} | **Characters:** ${chars}`);
            case 'base64':
                const action = interaction.options.getString('action');
                if (action === 'encode') {
                    return interaction.reply(`\`\`\`\n${Buffer.from(input).toString('base64')}\n\`\`\``);
                } else {
                    try {
                        return interaction.reply(`\`\`\`\n${Buffer.from(input, 'base64').toString('utf-8')}\n\`\`\``);
                    } catch (e) {
                        return interaction.reply({ content: '❌ Invalid Base64 input.', ephemeral: true });
                    }
                }
            case 'json':
                try {
                    const obj = JSON.parse(input);
                    return interaction.reply(`\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``);
                } catch (e) {
                    return interaction.reply({ content: '❌ Invalid JSON.', ephemeral: true });
                }
            case 'lorem':
                const count = interaction.options.getInteger('words') || 20;
                const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.".split(' ').slice(0, count).join(' ');
                return interaction.reply(`\`\`\`\n${lorem}...\n\`\`\``);
            case 'guid':
                const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                return interaction.reply(`🎲 **New GUID:** \`${guid}\``);
            case 'unix':
                return interaction.reply(`⌚ **Unix Timestamp:** \`${Math.floor(Date.now() / 1000)}\``);
        }
    }
};
