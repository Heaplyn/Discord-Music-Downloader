# Port JS Commands to TypeScript

Port several Discord bot commands from the `scope/` directory (JavaScript) to the `src/` directory (TypeScript).

## User Review Required

> [!IMPORTANT]
> The `notify` and `monitor` commands use `setInterval` to poll Roblox APIs. These intervals are stored in-memory and will be lost if the bot restarts.

## Proposed Changes

### Utilities

#### [NEW] [key.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/utils/key.ts)
Port `scope/utils/key.js` to TypeScript.

### Commands

#### [NEW] [cr.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/cr.ts)
Port `scope/commands/utility/cr.js`. Handles audio processing with FFmpeg (equalizer, speed adjustment) and spectrogram generation.

#### [NEW] [notify.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/notify.ts)
Port `scope/commands/utility/notify.js`. Monitors Roblox artists for new releases.

#### [NEW] [roblox.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/roblox.ts)
Port `scope/commands/utility/roblox.js`. Simulates Roblox audio compression and performs loudness analysis.

#### [NEW] [analyze.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/analyze.ts)
Port `scope/commands/utility/analyze.js`. Provides audio file info and waveform visualization.

#### [NEW] [monitor.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/monitor.ts)
Port `scope/commands/utility/monitor.js`. Monitors Roblox asset moderation status.

#### [NEW] [whitelist.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/commands/whitelist.ts)
Port `scope/commands/utility/whitelist.js`. Whitelists users.

### Main Entry Point

#### [MODIFY] [index.ts](file:///C:/Users/Kyle/Downloads/Projects/Discord Music Downloader/src/index.ts)
Register the new commands in the `commands` collection.

## Verification Plan

### Automated Tests
- N/A (Project doesn't seem to have a test suite, will rely on manual verification if possible or just ensuring compilation).

### Manual Verification
- Check if commands are correctly registered and show up in Discord (requires running the bot).
- Verify that TypeScript compiles without errors.
