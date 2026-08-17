import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChatInputCommandInteraction } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keysPath = path.join(__dirname, '../../keys.json');

const whitelistdisabled = false;

interface KeysData {
    validusers: {
        [userId: string]: {
            rank: string;
            reason?: string;
        };
    };
}

function getKeys(): KeysData {
    try {
        if (!fs.existsSync(keysPath)) {
            return { validusers: {} };
        }
        return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    } catch {
        console.error('no json for keys');
        return { validusers: {} };
    }
}

function saveKeys(data: KeysData): void {
    fs.writeFileSync(keysPath, JSON.stringify(data, null, 2));
}

export function isAuthorized(userId: string): boolean {
    if (whitelistdisabled) {
        return true;
    }
    const data = getKeys();
    const user = data.validusers[userId];
    return !!user;
}

export function blacklistedReason(userId: string): string | undefined {
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.reason;
}

export function isOwner(userId: string): boolean {
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.rank === "owner";
}

export function isAdmin(userId: string): boolean {
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.rank === "owner" || user?.rank === "admin";
}

export async function checkAuth(interaction: ChatInputCommandInteraction): Promise<boolean> {
    const userId = interaction.user.id;

    // Check if user is owner of the application
    const application = await interaction.client.application.fetch();
    const ownerId = application.owner?.id;

    if (userId === ownerId || isOwner(userId) || isAdmin(userId) || isAuthorized(userId)) {
        return true;
    }

    const message = "❌ This command is restricted to whitelisted users only.";
    if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: message, ephemeral: true });
    } else {
        await interaction.reply({ content: message, ephemeral: true });
    }
    return false;
}

export function whitelist(userId: string, rank: string): void {
    const data = getKeys();
    data.validusers[userId] = { rank };
    saveKeys(data);
}
