import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const envPath = path.join(projectRoot, '.env');

// 1. Check for API Key
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('❌ Discord Token missing or invalid. Opening Developer Portal...');
    execSync('start https://discord.com/developers/applications');

    // Create .env if it doesn't exist
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, 'DISCORD_TOKEN=YOUR_TOKEN_HERE\n');
        console.log('📝 Created .env file. Please paste your token there.');
    }
    process.exit(0);
}

// 2. Check for FlareSolverr
const flaresolverrDir = path.join(projectRoot, 'flaresolverr');
const flaresolverrExe = path.join(flaresolverrDir, 'flaresolverr.exe');

if (!fs.existsSync(flaresolverrExe)) {
    console.log('📦 FlareSolverr not found. Downloading...');
    try {
        if (!fs.existsSync(flaresolverrDir)) fs.mkdirSync(flaresolverrDir);

        const downloadCmd = `powershell -Command "& {
            $url = 'https://github.com/FlareSolverr/FlareSolverr/releases/latest/download/flaresolverr_windows_x64.zip';
            $zip = '${path.join(flaresolverrDir, 'flaresolverr.zip')}';
            Invoke-WebRequest -Uri $url -OutFile $zip;
            Expand-Archive -Path $zip -DestinationPath '${flaresolverrDir}' -Force;
            Remove-Item $zip;
        }"`;

        execSync(downloadCmd, { stdio: 'inherit' });
        console.log('✅ FlareSolverr installed.');
    } catch (e) {
        console.error('❌ Failed to install FlareSolverr automatically.', e);
    }
}

// 3. Redeploy Commands
console.log('🚀 Redeploying Slash Commands...');
try {
    execSync('npm run deploy-commands', { cwd: projectRoot, stdio: 'inherit' });
} catch (e) {
    console.error('❌ Failed to redeploy commands.');
}

// 4. Run the Bot
console.log('🤖 Starting the bot...');
try {
    execSync('npm run dev', { cwd: projectRoot, stdio: 'inherit' });
} catch (e) {
    console.error('❌ Bot crashed or failed to start.');
}
