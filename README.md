# Discord Music Downloader Bot (TypeScript Edition)

A high-performance Discord bot built with **TypeScript (Node.js)** that downloads audio tracks from various streaming services (such as SoundCloud, Amazon Music, Tidal, etc.) via headless browser automation and uploads them directly to your Discord chat or private messages.

It automatically handles Cloudflare Turnstile verification using **FlareSolverr** and compresses files larger than 10MB down to 128kbps MP3 format using **FFmpeg** to fit Discord's upload limits.

---

## Features

* **Pure TypeScript Stack:** Type-safe, modular, and modern slash commands powered by `discord.js` v14.
* **Native Node Browser Scraper:** Headless automation using Playwright (`src/services/lucida.ts`).
* **DM and Group Chat Compatible:** Supports user-installed contexts to download tracks directly in bot DMs.
* **Smart Audio Compressor:** Auto-compresses large high-quality audio downloads (e.g. FLAC) to fit within Discord upload limits.

---

## Prerequisites

1. **Node.js** v20 or higher.
2. **FFmpeg** installed on your system and added to your system `PATH`.
3. **FlareSolverr** binaries downloaded and placed in the `./flaresolverr/` directory.

---

## Installation & Setup

### 1. Clone & Install Dependencies
Open a PowerShell terminal in the project directory and run:
```powershell
npm install
```

### 2. Install Playwright Browsers
Install the headless Chromium browser binary used by the downloader:
```powershell
npx playwright install chromium
```

### 3. Configure the Bot (`.env`)
Create a `.env` file in the project root directory and add your bot's token:
```env
DISCORD_TOKEN=your_discord_bot_token_here
```

### 4. Deploy Slash Commands
Register your slash commands globally on Discord's API:
```powershell
npm run deploy-commands
```

---

## How to Run

### Step 1: Start FlareSolverr
To bypass Cloudflare protection reliably, run FlareSolverr in its own window:
1. Open a terminal and run:
   ```powershell
   cd flaresolverr
   .\flaresolverr.exe
   ```
2. Keep this window running in the background.

### Step 2: Start the Discord Bot
In your main project terminal, start the bot in hot-reloading development mode:
```powershell
npm run dev
```

---

## Slash Commands

* **`/ping`** - Test connection latency and verify bot online status.
* **`/download_music [url]`** - Downloads the target song, applies FFmpeg compression if it exceeds 10MB, uploads the attachment to Discord, and deletes the local file.

---

## Enabling DM (Private Message) Support

To use the `/download_music` command directly in private DMs with the bot:
1. Go to the **Discord Developer Portal** -> select your App -> **Installation** tab.
2. Enable **User Install** under "Installation Contexts" and save changes.
3. Open the Bot's profile card in Discord and click **"Add App"** to install it on your user account.
