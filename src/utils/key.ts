import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keysPath = path.join(__dirname, '../../keys.json');

const whitelistdisabled = true;

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
        return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    } catch {
        console.error('no json for keys retard');
        return { validusers: {} };
    }
}

function saveKeys(data: KeysData): void {
    fs.writeFileSync(keysPath, JSON.stringify(data, null, 2));
}

export function isAuthorized(userId: string): string | undefined {
    if (whitelistdisabled) {
        return "user";
    }
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.rank;
}

export function blacklistedReason(userId: string): string | undefined {
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.reason;
}

export function permcheck(userId: string): boolean {
    const data = getKeys();
    const user = data.validusers[userId];
    return user?.rank === "owner";
}

export function whitelist(userid: string | number): boolean {
    const data = getKeys();

    data.validusers[userid.toString()] = { "rank": "user" };
    saveKeys(data);

    return true;
}
