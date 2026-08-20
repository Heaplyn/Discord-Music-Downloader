import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    CategoryChannel,
    TextChannel,
    VoiceChannel
} from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import { checkAuth } from '../../Layer1/key.js';

export const setupServerCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup_server')
        .setDescription('Automatically setup server categories and channels using AI.')
        .addStringOption(opt =>
            opt.setName('description')
                .setDescription('Describe the server layout you want (e.g. "Gaming server with RPG and FPS sections")')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!await checkAuth(interaction)) return;
        if (!interaction.guild) return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });

        const description = interaction.options.getString('description', true);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return interaction.reply({ content: '❌ Gemini API Key is missing in .env file.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const systemPrompt = `You are a Discord server architect. Based on the user request, generate a JSON structure for a Discord server.
Return ONLY valid JSON in the following format, no other text or explanation:
{
  "categories": [
    {
      "name": "Category Name",
      "channels": [
        { "name": "channel-name", "type": "text" | "voice" }
      ]
    }
  ],
  "roles": [
    { "name": "Role Name", "color": "#HEXCOLOR" }
  ]
}`;

            const userPrompt = `Request: "${description}"`;
            const payload = {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };

            const models = [
                "gemini-3.5-flash",
                "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-2.5-flash-lite",
                "gemini-1.5-flash",
                "gemini-1.5-pro"
            ];
            const versions = ["v1beta", "v1"];
            let data: any = null;
            let lastError = "";

            // Robust loop to find a working model/version combination
            outerLoop: for (const model of models) {
                for (const ver of versions) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${apiKey}`;
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        data = await response.json();

                        // Try OAuth fallback if unauthenticated
                        if (response.status === 401 || (data.error && data.error.status === 'UNAUTHENTICATED')) {
                            const oauthUrl = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent`;
                            const oauthResp = await fetch(oauthUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${apiKey}`
                                },
                                body: JSON.stringify(payload)
                            });
                            data = await oauthResp.json();
                        }

                        if (data && !data.error) break outerLoop;
                        if (data?.error) lastError = data.error.message;

                    } catch (e: any) {
                        lastError = e.message;
                    }
                }
            }

            if (!data || data.error) {
                return interaction.editReply(`❌ Gemini API Error: ${lastError || 'All models failed.'}`);
            }

            let geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!geminiText.trim()) {
                const finishReason = data.candidates?.[0]?.finishReason;
                return interaction.editReply(`❌ Gemini API returned an empty response. (Finish reason: ${finishReason || 'UNKNOWN'})`);
            }

            let config;
            try {
                // Robust extraction: find the outermost JSON object braces
                const jsonStart = geminiText.indexOf('{');
                const jsonEnd = geminiText.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    geminiText = geminiText.substring(jsonStart, jsonEnd + 1);
                }
                config = JSON.parse(geminiText);
            } catch (e) {
                console.error('Failed to parse Gemini JSON:', geminiText);
                return interaction.editReply('❌ AI generated an invalid JSON structure. Please try again with a different description.');
            }

            await interaction.editReply('🏗️ Building your server... (This may take a moment)');

            // 1. Create Roles
            if (config.roles && Array.isArray(config.roles)) {
                for (const roleData of config.roles) {
                    try {
                        await interaction.guild.roles.create({
                            name: roleData.name,
                            color: roleData.color || undefined,
                            reason: 'AI Server Setup'
                        });
                    } catch (e) {
                        console.error(`Failed to create role: ${roleData.name}`, e);
                    }
                }
            }

            // 2. Create Categories and Channels
            if (config.categories && Array.isArray(config.categories)) {
                for (const catData of config.categories) {
                    try {
                        const category = await interaction.guild.channels.create({
                            name: catData.name,
                            type: ChannelType.GuildCategory,
                            reason: 'AI Server Setup'
                        }) as CategoryChannel;

                        if (catData.channels && Array.isArray(catData.channels)) {
                            for (const chanData of catData.channels) {
                                await interaction.guild.channels.create({
                                    name: chanData.name,
                                    type: chanData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                                    parent: category.id,
                                    reason: 'AI Server Setup'
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to create category or channel: ${catData.name}`, e);
                    }
                }
            }

            await interaction.editReply('✅ Server setup complete!');
        } catch (error: any) {
            console.error('Setup Server Error:', error);
            await interaction.editReply(`❌ An error occurred: ${error.message}`);
        }
    }
};
