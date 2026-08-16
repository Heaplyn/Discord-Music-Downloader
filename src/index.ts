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
import { crCommand } from './commands/cr.js';
import { notifyCommand } from './commands/notify.js';
import { robloxCommand } from './commands/roblox.js';
import { analyzeCommand } from './commands/analyze.js';
import { monitorCommand } from './commands/monitor.js';
import { whitelistCommand } from './commands/whitelist.js';

// 1. Resolve path to .env file at the root level
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// 2. Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 3. Register commands inside our collection
const commands = new Collection<string, Command>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(downloadCommand.data.name, downloadCommand);
commands.set(crCommand.data.name, crCommand);
commands.set(notifyCommand.data.name, notifyCommand);
commands.set(robloxCommand.data.name, robloxCommand);
commands.set(analyzeCommand.data.name, analyzeCommand);
commands.set(monitorCommand.data.name, monitorCommand);
commands.set(whitelistCommand.data.name, whitelistCommand);

// Function to start FlareSolverr dynamically using PowerShell ShellExecute
function startFlareSolverr() {
    const flaresolverrDir = path.resolve(__dirname, '../flaresolverr');
    const flaresolverrPath = path.join(flaresolverrDir, 'flaresolverr.exe');

    if (!fs.existsSync(flaresolverrPath)) {
        console.log(`✗ FlareSolverr executable not found at: ${flaresolverrPath}`);
        return;
    }

    console.log('Spawning FlareSolverr via Windows ShellExecute (simulating double-click)...');
    try {
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

// 4. Log confirmation when the bot goes online
client.once('clientReady', () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🤖 Logged in as ${client.user?.tag}!`);
    console.log(`TypeScript Discord Bot is now online and active.`);
    console.log(`Registered ${commands.size} active commands.`);
    console.log(`--------------------------------------------------\n`);
    const is_vs_code = process.env.TERM_PROGRAM === 'vscode';
    if (!is_vs_code) {
        startFlareSolverr();
    } else {
        console.log("VS Code");
    }
    // Auto-launch FlareSolverr (For manual background execution, see guide)
    
});

// 5. Handle incoming interactions dynamically
client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        
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
