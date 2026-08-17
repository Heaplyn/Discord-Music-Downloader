import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType
} from 'discord.js';
import { whitelist, isOwner } from '../../Layer1/key.js';
import { Command } from '../../Layer0/Command.js';

export const whitelistCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('whitelist a user (Owner only)')
        .addUserOption(opt =>
            opt.setName('user').setDescription('user to whitelist').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('rank').setDescription('rank for the user').setRequired(false)
                .addChoices(
                    { name: 'User', value: 'user' },
                    { name: 'Admin', value: 'admin' },
                    { name: 'Owner', value: 'owner' }
                )
        )
        .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel]) as any,

    async execute(interaction: ChatInputCommandInteraction) {
        const application = await interaction.client.application.fetch();
        const appOwnerId = application.owner?.id;

        if (interaction.user.id !== appOwnerId && !isOwner(interaction.user.id)) {
            return interaction.reply({ content: "❌ Only the bot owner can use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('user', true);
        const rank = interaction.options.getString('rank') ?? 'user';

        whitelist(target.id, rank);

        await interaction.reply({
            content: `✅ ${target.username} has been whitelisted as **${rank}**`,
        });
    },
};
