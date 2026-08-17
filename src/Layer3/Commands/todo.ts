import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../../data');
const todoFile = path.join(dataDir, 'todo.json');

interface TodoItem {
    id: number;
    task: string;
    completed: boolean;
    user: string;
}

export const todoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('todo')
        .setDescription('Manage your personal todo list.')
        .addSubcommand(sub => sub.setName('add').setDescription('Add a new task').addStringOption(opt => opt.setName('task').setDescription('The task description').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List your tasks'))
        .addSubcommand(sub => sub.setName('done').setDescription('Mark a task as done').addIntegerOption(opt => opt.setName('id').setDescription('The task ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a task').addIntegerOption(opt => opt.setName('id').setDescription('The task ID').setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        let todos: TodoItem[] = [];
        if (fs.existsSync(todoFile)) {
            try {
                todos = JSON.parse(fs.readFileSync(todoFile, 'utf-8'));
            } catch (e) {
                todos = [];
            }
        }

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (subcommand === 'add') {
            const taskText = interaction.options.getString('task', true);
            const newItem: TodoItem = {
                id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
                task: taskText,
                completed: false,
                user: userId
            };
            todos.push(newItem);
            fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
            await interaction.reply(`✅ Added task: **${taskText}** (ID: ${newItem.id})`);
        }
        else if (subcommand === 'list') {
            const userTodos = todos.filter(t => t.user === userId);
            if (userTodos.length === 0) {
                return interaction.reply('📭 Your todo list is empty.');
            }

            const embed = new EmbedBuilder()
                .setTitle(`📝 ${interaction.user.username}'s Todo List`)
                .setColor('#00ff00');

            let listText = userTodos.map(t => {
                const status = t.completed ? '✅' : '⏳';
                return `**${t.id}.** ${status} ${t.task}`;
            }).join('\n');

            embed.setDescription(listText);
            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'done') {
            const id = interaction.options.getInteger('id', true);
            const todo = todos.find(t => t.id === id && t.user === userId);
            if (!todo) return interaction.reply({ content: '❌ Task not found.', ephemeral: true });

            todo.completed = true;
            fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
            await interaction.reply(`✅ Marked task **#${id}** as done!`);
        }
        else if (subcommand === 'delete') {
            const id = interaction.options.getInteger('id', true);
            const index = todos.findIndex(t => t.id === id && t.user === userId);
            if (index === -1) return interaction.reply({ content: '❌ Task not found.', ephemeral: true });

            const deleted = todos.splice(index, 1);
            fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
            await interaction.reply(`🗑️ Deleted task: **${deleted[0].task}**`);
        }
    }
};
