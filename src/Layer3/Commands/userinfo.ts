import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const userinfoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about a user.')
        .addUserOption(opt => opt.setName('target').setDescription('The user to get info about')),

    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild?.members.fetch(user.id);

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL())
            .setColor('#5865F2')
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : 'Not in server', inline: true },
                { name: 'Roles', value: member?.roles.cache.map(r => r.name).join(', ') || 'None' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
