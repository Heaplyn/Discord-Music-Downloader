import { REST, Routes, SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import commands
import { pingCommand } from './commands/ping.js';
import { downloadCommand } from './commands/download.js';
import { crCommand } from './commands/cr.js';
import { notifyCommand } from './commands/notify.js';
import { robloxCommand } from './commands/roblox.js';
import { analyzeCommand } from './commands/analyze.js';
import { monitorCommand } from './commands/monitor.js';

// 1. Load env variables from parent folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('✗ Error: DISCORD_TOKEN is missing in your .env file!');
    process.exit(1);
}

// 2. Automatically extract Client ID from the Discord Token
const clientId = Buffer.from(TOKEN.split('.')[0], 'base64').toString('utf-8');

// 3. Define the Slash Commands
const commandsList = [
    pingCommand,
    downloadCommand,
    crCommand,
    notifyCommand,
    robloxCommand,
    analyzeCommand,
    monitorCommand
];

const commands = commandsList.map(command => {
    const data = command.data as any;

    // Ensure all commands have the correct contexts and integration types for consistency
    if (typeof data.setContexts === 'function') {
        data.setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        );
    }
    if (typeof data.setIntegrationTypes === 'function') {
        data.setIntegrationTypes(
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall
        );
    }

    console.log(`  - Found command: ${data.name}`);
    return data.toJSON();
});

// 4. Create the REST client and deploy
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

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
