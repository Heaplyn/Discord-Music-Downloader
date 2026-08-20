import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { checkAuth } from '../../Layer1/key.js';

export const modCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation tools (Restricted).')
        .addSubcommand(sub => sub.setName('purge').setDescription('Delete multiple messages').addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100)))
        .addSubcommand(sub => sub.setName('slowmode').setDescription('Set channel slowmode').addIntegerOption(opt => opt.setName('seconds').setDescription('Slowmode delay in seconds').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'purge':
                const amount = interaction.options.getInteger('amount', true);
                const channel = interaction.channel as TextChannel;

                try {
                    const deleted = await channel.bulkDelete(amount, true);
                    return interaction.reply({ content: `🧹 Deleted **${deleted.size}** messages.`, ephemeral: true });
                } catch (e) {
                    return interaction.reply({ content: '❌ Failed to purge messages. They might be too old.', ephemeral: true });
                }

            case 'slowmode':
                const seconds = interaction.options.getInteger('seconds', true);
                try {
                    await (interaction.channel as TextChannel).setRateLimitPerUser(seconds);
                    return interaction.reply(`⏳ Slowmode set to **${seconds}** seconds.`);
                } catch (e) {
                    return interaction.reply({ content: '❌ Failed to set slowmode.', ephemeral: true });
                }
        }
    }
};
