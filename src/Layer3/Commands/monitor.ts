import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType
} from 'discord.js';
import * as dotenv from 'dotenv';
import { Command } from '../../Layer0/Command.js';
import { checkAuth } from '../../Layer1/key.js';

dotenv.config();

const activeMonitors = new Map<string, NodeJS.Timeout>();
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

export const monitorCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('monitor')
        .setDescription('monitors a roblox asset id moderation status')
        .addStringOption((option) =>
            option.setName('id')
                .setDescription('the asset id')
                .setRequired(true)
        ) as any,

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;

        const assetid = interaction.options.getString('id', true).toLowerCase();

        if (!ROBLOX_COOKIE) {
            await interaction.reply({ content: 'no roblox cookie detected (retard?)', ephemeral: true });
            return;
        }

        if (activeMonitors.has(assetid)) {
            await interaction.reply({ content: `already monitoring \`${assetid}\`. ignoring...`, ephemeral: false });
            return;
        }

        await interaction.deferReply();

        try {
            const initialResponse = await fetch(`https://apis.roblox.com/assets/user-auth/v1/assets/${assetid}`, {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!initialResponse.ok) {
                if (initialResponse.status === 401) {
                    await interaction.editReply('❌ authentication failed. check cookie');
                    return;
                }
                await interaction.editReply('❌ failed to fetch asset. check the asset ID.');
                return;
            }

            const initialData = await initialResponse.json() as any;
            const initialState = initialData?.moderationResult?.moderationState;
            const assetDisplay = initialData?.displayName;

            if (!initialState) {
                await interaction.editReply('could not read moderation state.');
                return;
            }

            if (initialState !== 'Reviewing') {
                await interaction.editReply(`asset is already **${initialState}**`);
                return;
            }

            await interaction.editReply(`monitoring asset \`${assetid}\` (${assetDisplay})\ncurrent status: **${initialState}**`);

            const intervalId = setInterval(async () => {
                try {
                    const response = await fetch(`https://apis.roblox.com/assets/user-auth/v1/assets/${assetid}`, {
                        headers: {
                            'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        clearInterval(intervalId);
                        activeMonitors.delete(assetid);

                        if (response.status === 401) {
                            await interaction.followUp('❌ authentication expired retard. monitoring stopped.');
                            return;
                        }
                        await interaction.followUp('❌ error fetching asset. monitoring stopped.');
                        return;
                    }

                    const data = await response.json() as any;
                    const currentState = data?.moderationResult?.moderationState;
                    const currentDescription = data?.description || "";

                    if (currentState && currentState !== 'Reviewing' && currentState !== initialState) {
                        clearInterval(intervalId);
                        activeMonitors.delete(assetid);

                        const emoji = currentState === 'Approved' ? '✅' : '❌';
                        const copyrighted = currentDescription.includes("(Removed for violations of Roblox Terms of Use)");
                        await interaction.followUp(`${emoji} asset \`${assetid}\` (${assetDisplay}) is now: **${currentState}**`);
                        if (copyrighted) {
                            await interaction.followUp(`asset was copyrighted btw`);
                        }
                    }
                } catch (error) {
                    console.error('Monitor error:', error);
                    clearInterval(intervalId);
                    activeMonitors.delete(assetid);
                    await interaction.followUp('error. stopped monitoring lol.');
                }
            }, 6000);

            activeMonitors.set(assetid, intervalId);

            setTimeout(() => {
                if (activeMonitors.has(assetid)) {
                    clearInterval(intervalId);
                    activeMonitors.delete(assetid);
                    interaction.followUp('monitoring timed out after 15 minutes.').catch(() => {});
                }
            }, 890000);

        } catch (error) {
            console.error('Execute error:', error);
            await interaction.editReply('an error occurred while setting up monitoring.');
        }
    },
};
