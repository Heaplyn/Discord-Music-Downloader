import { Client, Collection, GatewayIntentBits, Interaction } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Import our modular commands
import { Command } from './types/Command.js';
import { pingCommand } from './commands/ping.js';
import { downloadCommand } from './commands/download.js';

// 1. Resolve path to parent folder's .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 2. Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 3. Register commands inside a type-safe collection (registry map)
const commands = new Collection<string, Command>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(downloadCommand.data.name, downloadCommand);

// Function to start FlareSolverr in a separate Windows console (detaching it)
function startFlareSolverr() {
    const flaresolverrDir = path.resolve(__dirname, '../../flaresolverr');
    const flaresolverrPath = path.join(flaresolverrDir, 'flaresolverr.exe');

    if (!fs.existsSync(flaresolverrPath)) {
        console.log(`✗ FlareSolverr executable not found at: ${flaresolverrPath}`);
        return;
    }

    console.log('Spawning FlareSolverr via Windows ShellExecute (simulating double-click)...');
    try {
        // Use PowerShell's Start-Process to spawn the exe completely independent of Node's process tree!
        const command = `powershell -Command "Start-Process flaresolverr.exe -WorkingDirectory '${flaresolverrDir}'"`;
        
        exec(command, (err) => {
            if (err) {
                console.error('✗ Failed to launch FlareSolverr:', err);
            }
        });
        console.log('✓ FlareSolverr launched independently.');
    } catch (e) {
        console.error('✗ Failed to launch FlareSolverr:', e);
    }
}
if (process.env.TERM_PROGRAM !== 'vscode') {
    startFlareSolverr();
}

// 4. Log confirmation when the bot goes online
client.once('clientReady', () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🤖 Logged in as ${client.user?.tag}!`);
    console.log(`TypeScript Discord Bot is now online and active.`);
    console.log(`Registered ${commands.size} active commands.`);
    console.log(`--------------------------------------------------\n`);
    
    // Auto-launch FlareSolverr
    //startFlareSolverr();
});

// 5. Handle incoming interactions dynamically
client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Look up command in our map
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Execute the command logic
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        
        // Handle reply state gracefully
        const errorContent = '❌ There was an error executing this command!';
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: errorContent, ephemeral: true });
        } else {
            await interaction.reply({ content: errorContent, ephemeral: true });
        }
    }
});

// 6. Connect the Bot
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('✗ Error: DISCORD_TOKEN is missing in your .env file!');
    process.exit(1);
}

client.login(TOKEN);
