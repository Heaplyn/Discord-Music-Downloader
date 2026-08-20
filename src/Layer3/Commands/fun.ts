import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const funCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('A collection of fun mini-commands.')
        .addSubcommand(sub => sub.setName('joke').setDescription('Get a random dad joke'))
        .addSubcommand(sub => sub.setName('quote').setDescription('Get an inspirational quote'))
        .addSubcommand(sub => sub.setName('8ball').setDescription('Ask the magic 8-ball a question').addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'joke':
                try {
                    const response = await fetch('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
                    const data = await response.json() as any;
                    return interaction.reply(`🤣 **Joke:** ${data.joke}`);
                } catch (e) {
                    return interaction.reply('❌ Failed to get a joke.');
                }

            case 'quote':
                try {
                    const response = await fetch('https://zenquotes.io/api/random');
                    const data = await response.json() as any;
                    return interaction.reply(`📜 **Quote:** "${data[0].q}" — *${data[0].a}*`);
                } catch (e) {
                    return interaction.reply('❌ Failed to get a quote.');
                }

            case '8ball':
                const question = interaction.options.getString('question', true);
                const answers = [
                    "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
                    "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
                    "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
                    "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
                    "Don't count on it.", "My reply is no.", "My sources say no.",
                    "Outlook not so good.", "Very doubtful."
                ];
                const answer = answers[Math.floor(Math.random() * answers.length)];
                return interaction.reply(`🎱 **Question:** ${question}\n✨ **Answer:** ${answer}`);
        }
    }
};
