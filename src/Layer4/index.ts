import { Client, Collection, GatewayIntentBits, Interaction } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Import our modular commands
import { Command } from '../Layer0/Command.js';
import { pingCommand } from '../Layer3/Commands/ping.js';
import { downloadCommand } from '../Layer3/Commands/download.js';
import { listCommand } from '../Layer3/Commands/list.js';
import { sysinfoCommand } from '../Layer3/Commands/sysinfo.js';
import { mathCommand } from '../Layer3/Commands/math.js';
import { todoCommand } from '../Layer3/Commands/todo.js';
import { weatherCommand } from '../Layer3/Commands/weather.js';
import { userinfoCommand } from '../Layer3/Commands/userinfo.js';
import { serverinfoCommand } from '../Layer3/Commands/serverinfo.js';
import { pollCommand } from '../Layer3/Commands/poll.js';
import { helpCommand } from '../Layer3/Commands/help.js';
import { crCommand } from '../Layer3/Commands/cr.js';
import { notifyCommand } from '../Layer3/Commands/notify.js';
import { robloxCommand } from '../Layer3/Commands/roblox.js';
import { analyzeCommand } from '../Layer3/Commands/analyze.js';
import { monitorCommand } from '../Layer3/Commands/monitor.js';
import { whitelistCommand } from '../Layer3/Commands/whitelist.js';
import { hashCommand } from '../Layer3/Commands/hash.js';
import { reversetextCommand } from '../Layer3/Commands/reversetext.js';
import { urbanCommand } from '../Layer3/Commands/urban.js';
import { avatarCommand } from '../Layer3/Commands/avatar.js';
import { diceCommand } from '../Layer3/Commands/dice.js';
import { networkCommand } from '../Layer3/Commands/network.js';
import { powerCommand } from '../Layer3/Commands/power.js';
import { systemCommand } from '../Layer3/Commands/system.js';
import { textCommand } from '../Layer3/Commands/text.js';
import { timerCommand } from '../Layer3/Commands/timer.js';
import { voiceCommand } from '../Layer3/Commands/voice.js';
import { webCommand } from '../Layer3/Commands/web.js';
import { translateCommand } from '../Layer3/Commands/translate.js';
import { remindCommand } from '../Layer3/Commands/remind.js';
import { screenshotCommand } from '../Layer3/Commands/screenshot.js';
import { economyCommand } from '../Layer3/Commands/economy.js';
import { dictionaryCommand } from '../Layer3/Commands/dictionary.js';
import { shortenCommand } from '../Layer3/Commands/shorten.js';
import { passwordCommand } from '../Layer3/Commands/password.js';
import { qrcodeCommand } from '../Layer3/Commands/qrcode.js';
import { cryptoCommand } from '../Layer3/Commands/crypto.js';

// 1. Resolve path to .env file at the root level
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

// 3. Register commands inside our collection
const commands = new Collection<string, Command>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(downloadCommand.data.name, downloadCommand);
commands.set(listCommand.data.name, listCommand);
commands.set(sysinfoCommand.data.name, sysinfoCommand);
commands.set(mathCommand.data.name, mathCommand);
commands.set(todoCommand.data.name, todoCommand);
commands.set(weatherCommand.data.name, weatherCommand);
commands.set(userinfoCommand.data.name, userinfoCommand);
commands.set(serverinfoCommand.data.name, serverinfoCommand);
commands.set(pollCommand.data.name, pollCommand);
commands.set(helpCommand.data.name, helpCommand);
commands.set(crCommand.data.name, crCommand);
commands.set(notifyCommand.data.name, notifyCommand);
commands.set(robloxCommand.data.name, robloxCommand);
commands.set(analyzeCommand.data.name, analyzeCommand);
commands.set(monitorCommand.data.name, monitorCommand);
commands.set(whitelistCommand.data.name, whitelistCommand);
commands.set(hashCommand.data.name, hashCommand);
commands.set(reversetextCommand.data.name, reversetextCommand);
commands.set(urbanCommand.data.name, urbanCommand);
commands.set(avatarCommand.data.name, avatarCommand);
commands.set(diceCommand.data.name, diceCommand);
commands.set(networkCommand.data.name, networkCommand);
commands.set(powerCommand.data.name, powerCommand);
commands.set(systemCommand.data.name, systemCommand);
commands.set(textCommand.data.name, textCommand);
commands.set(timerCommand.data.name, timerCommand);
commands.set(voiceCommand.data.name, voiceCommand);
commands.set(webCommand.data.name, webCommand);
commands.set(translateCommand.data.name, translateCommand);
commands.set(remindCommand.data.name, remindCommand);
commands.set(screenshotCommand.data.name, screenshotCommand);
commands.set(economyCommand.data.name, economyCommand);
commands.set(dictionaryCommand.data.name, dictionaryCommand);
commands.set(shortenCommand.data.name, shortenCommand);
commands.set(passwordCommand.data.name, passwordCommand);
commands.set(qrcodeCommand.data.name, qrcodeCommand);
commands.set(cryptoCommand.data.name, cryptoCommand);

// Function to start FlareSolverr dynamically using PowerShell ShellExecute
function startFlareSolverr() {
    const flaresolverrDir = path.resolve(__dirname, '../../flaresolverr');
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
