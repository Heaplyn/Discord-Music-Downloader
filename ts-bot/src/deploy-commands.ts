import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 1. Load env variables from parent folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('✗ Error: DISCORD_TOKEN is missing in your .env file!');
    process.exit(1);
}

// 2. Automatically extract Client ID from the Discord Token
// Discord tokens are structured as: [CLIENT_ID_BASE64].[RANDOM_STRING].[SIGNATURE]
const clientId = Buffer.from(TOKEN.split('.')[0], 'base64').toString('utf-8');

// 3. Define the Slash Commands
const commands = [
    // /ping
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),

    // /download_music
    new SlashCommandBuilder()
        .setName('download_music')
        .setDescription('Downloads music from a website using lucida.to')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to download (Tidal, SoundCloud, Amazon, Qobuz, etc.)')
                .setRequired(true)
        )
].map(command => command.toJSON());

// 4. Create the REST client and deploy
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Deploy commands globally
        const data: any = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        console.log(`Your slash commands are now registered on Discord!`);
    } catch (error) {
        console.error('✗ Failed to deploy commands:', error);
    }
})();
