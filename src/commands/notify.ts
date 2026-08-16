import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    AttachmentBuilder
} from 'discord.js';
import * as dotenv from 'dotenv';
import { Command } from '../types/Command.js';

dotenv.config();

const artists = new Map<string, NodeJS.Timeout>();
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

export const notifyCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('checks an artist name for a new release')
        .addStringOption((option) =>
            option.setName('artist')
                .setDescription('artist you want (case sensitive)')
                .setRequired(true)
        ) as any,

    async execute(interaction: ChatInputCommandInteraction) {
        const artist = interaction.options.getString('artist', true);

        if (!ROBLOX_COOKIE) {
            await interaction.reply({ content: 'no roblox cookie detected (retard?)', ephemeral: true });
            return;
        }

        if (artists.has(artist)) {
            const interval = artists.get(artist);
            if (interval) clearInterval(interval);
            artists.delete(artist);
            await interaction.reply({ content: `removed ${artist} from the monitoring pool` });
            return;
        }

        await interaction.deferReply();

        const apilink = `https://apis.roblox.com/toolbox-service/v1/marketplace/3?artist=${artist}&limit=999999&uiSortIntent=10`;

        try {
            const initialResponse = await fetch(apilink, {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!initialResponse.ok) {
                if (initialResponse.status === 401) {
                    await interaction.editReply('authentication failed. check cookie');
                    return;
                }
                await interaction.editReply(`failed ${initialResponse.status}`);
                return;
            }

            const data = await initialResponse.json() as any;
            let results = data.totalResults;

            if (results <= 0) {
                await interaction.editReply("this artist is empty. did you type in the name correctly");
                return;
            }

            await interaction.editReply(`now starting to check artist ${artist} for a new release.`);

            const int = setInterval(async () => {
                try {
                    const response = await fetch(apilink, {
                        headers: {
                            'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        if (response.status === 401) {
                            clearInterval(int);
                            artists.delete(artist);
                            await interaction.followUp('authentication expired.');
                            return;
                        }

                        if (response.status === 429) {
                            console.log('ratelimited for a moment. could be due to multiple artists being monitored at once. continuing..');
                            return;
                        }

                        return;
                    }

                    const returned = await response.json() as any;
                    const newresults = returned.totalResults;

                    if (newresults > results) {
                        clearInterval(int);
                        artists.delete(artist);

                        const newid = returned.data[0].id.toString();
                        const user = await interaction.client.users.fetch(interaction.user.id);

                        try {
                            const assetResponse = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${newid}`, {
                                headers: {
                                    'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                                },
                                redirect: 'follow'
                            });

                            if (assetResponse.ok) {
                                const audioBuffer = await assetResponse.arrayBuffer();
                                const attachment = new AttachmentBuilder(
                                    Buffer.from(audioBuffer),
                                    { name: `${artist}_${newid}.ogg` }
                                );

                                await user.send({
                                    content: `<@${interaction.user.id}> new release detected for artist ${artist}.\nasset id: \`${newid}\`\nroblox link: https://roblox.com/library/${newid}`,
                                    files: [attachment]
                                });
                            } else {
                                await user.send(`<@${interaction.user.id}> new release detected for artist ${artist}.\nasset id: \`${newid}\`\nroblox link: https://roblox.com/library/${newid}\ncould not download audio (status ${assetResponse.status})`);
                            }
                        } catch (downloadError: any) {
                            await user.send(`<@${interaction.user.id}> new release detected for artist ${artist}.\nasset id: \`${newid}\`\nroblox link: https://roblox.com/library/${newid}\ndownload failed: ${downloadError.message}`);
                        }
                    } else if (newresults < results) {
                        results = newresults;
                        const user = await interaction.client.users.fetch(interaction.user.id);
                        await user.send(`<@${interaction.user.id}> a release for artist ${artist} was moderated/archived. just letting you know.`);
                    }
                } catch (error) {
                    clearInterval(int);
                    artists.delete(artist);
                    await interaction.followUp(`error. ${error}`);
                }
            }, 60000);

            artists.set(artist, int);
        } catch (error) {
            console.error('execute error:', error);
            await interaction.editReply(`error: ${error}`);
        }
    },
};
