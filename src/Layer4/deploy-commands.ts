import { REST, Routes, SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import commands
import { weatherCommand } from '../Layer3/Commands/weather.js';
import { setupServerCommand } from '../Layer3/Commands/setup_server.js';
import { funCommand } from '../Layer3/Commands/fun.js';
import { modCommand } from '../Layer3/Commands/mod.js';
import { userinfoCommand } from '../Layer3/Commands/userinfo.js';
import { serverinfoCommand } from '../Layer3/Commands/serverinfo.js';
import { pollCommand } from '../Layer3/Commands/poll.js';
import { pingCommand } from '../Layer3/Commands/ping.js';
import { downloadCommand } from '../Layer3/Commands/download.js';
import { listCommand } from '../Layer3/Commands/list.js';
import { sysinfoCommand } from '../Layer3/Commands/sysinfo.js';
import { mathCommand } from '../Layer3/Commands/math.js';
import { todoCommand } from '../Layer3/Commands/todo.js';
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
const clientId = Buffer.from(TOKEN.split('.')[0], 'base64').toString('utf-8');

// 3. Define the Slash Commands
const commandsList = [
    pingCommand,
    weatherCommand,
    setupServerCommand,
    funCommand,
    modCommand,
    userinfoCommand,
    serverinfoCommand,
    pollCommand,
    downloadCommand,
    listCommand,
    sysinfoCommand,
    mathCommand,
    todoCommand,
    helpCommand,
    crCommand,
    notifyCommand,
    robloxCommand,
    analyzeCommand,
    monitorCommand,
    whitelistCommand,
    hashCommand,
    reversetextCommand,
    urbanCommand,
    avatarCommand,
    diceCommand,
    networkCommand,
    powerCommand,
    systemCommand,
    textCommand,
    timerCommand,
    voiceCommand,
    webCommand,
    translateCommand,
    remindCommand,
    screenshotCommand,
    economyCommand,
    dictionaryCommand,
    shortenCommand,
    passwordCommand,
    qrcodeCommand,
    cryptoCommand
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
