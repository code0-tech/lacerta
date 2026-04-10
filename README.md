<div align="center">
<h1>Lacerta our CodeZero Discord Bot</h1>
</div>

### Basic Overview:

CodeZero is a Discord bot developed in JavaScript, utilizing the discord.js client library along with a lightweight web server for GitHub OAuth authentication. This enables certain commands, such as retrieving commit and pull request data.

### Requirements:

- HTTP Port: Required for GitHub OAuth, configured via `http-config.port` in `./http-config.json`.

- **MongoDB:** Used for storing user and bot-related data, including:
  - XP statistics
  - Message count statistics
  - Command usage data
  - Flags
  - Temp Entries
  - Channel Stats
  - Slowed Channels
  - Git Commits
  - Logs
#

## Main Interactions

|     | Command                                      | Status       | Known Bugs
| --- | ---------------------------------------------| ------------ | --------- |
| 1   | `/open-contributer`                          | Finished     |      None |
| 2   | `/links`                                     | Finished     |      None |
| 3   | `/contributor`                               | Finished     |      None |
| 4   | `/rank` or `/rank @user` +uptodate15         | Finished     |      None |
| 5   | `/leaderboard` or `/leaderboard limit: 1-20` | Finished     |      None |
| 6   | `CodeZero Application Channel Threads`       | Finished     |      None |
| 7   | `/stats` or `/stats @user` + uptodate15      | Finished     |      None |
| 8   | `/logs show` or `/logs list`                 | Finished     |      None |
| 9   | `/debug` for debugging                       | Finished     |      None |
| 10  | `/git` charts / tables for Git activity      | Finished     |      None |
| 11  | `/mydata` return your current MongoDb entry  | Finished     |      None |
| 12  | `/settings` change discord server settings   | Missing Func.|      None |

## Functions

|     | Function                                     | Status       | Known Bugs
| --- | ---------------------------------------------| ------------ | --------- |
| 1   | Stats and Xp from sent messages              | Finished     |      None |
| 2   | Voice Stats                                  | Finished     |      None |
| 3   | Event prereminder                            | Finished     |      None |
| 4   | Channel Auto Slowmo                          | Finished     |      None |
| 5   | Git rank + Chart everyday                    | Finished     |      None |
| 6   | Invite Tracker                               | Finished     |      None |
| 7   | Global Voice and Message count per channel   | Finished     |      None |

## Language

We currently provide `3` languages

- german.json
- english.json
- lolcat.json (custom version)

Made by using the inbuild web editor...

Run it via `npm run editor` then visit `http://localhost:3000` via a browser

Note: If a german key for translation is missing, the bot will fallback to english

## Tracking

The bot collects and processes certain statistics, as visible in the source code:

- Message Statistics: Number of messages, words, and characters sent.
- Voice Statistics: Join/leave events, channel switches, and total voice time.

## GitHub OAuth
For /open-contributer, OAuth URLs are not stored. This means authentication is required each time the command is executed.

## Command Tracking

Real Example:
```json
{
  "_id": {
    "$oid": "6644f92497346d3e063052fe"
  },
  "id": "380808844093292555",
  "rawxp": 3146,
  "stats": {
    "messages": {
      "words": 7313,
      "chars": 38581,
      "count": 1284
    },
    "invites": {
      "total": 1,
      "real": 1,
      "usersInvited": [
        {
          "id": "703586032578199641",
          "time": {
            "$numberLong": "1765912177218"
          }
        }
      ]
    },
    "voice": {
      "_totalCalculated": 70897,
      "activeTime": 61430,
      "joinCount": 22,
      "channelSwitches": 2,
      "selfMuteTime": 6164,
      "selfDeafTime": 55,
      "streamingTime": 308
    }
  },
  "flags": {
    "invitesGiftReceived": false,
    "emojiInfoForMessageXp": false
  },
  "commandUsage": {
    "debug": {
      "command": 116,
      "button": 27,
      "selectmenu": 18
    },
    "leaderboard": {
      "command": 98
    },
    "stats": {
      "command": 152
    }
    // More...
  }
}
```

Last MongoDB structure update: 10.04.2026

Tip: You can mention a Discord user by their ID using `<@user_id>`.

## Database

The MongoDb tables are defined in ./src/models/Mongo.js

## Missing Files
This repository mirrors the live bot but excludes sensitive or unnecessary files:

- `node_modules/` – Not included (use npm install to generate).
- `server.env / .env` – Contains private configuration and tokens.
- `unused-temp.js` – Unused code snippets, kept for reference.
- `a-workon/` – Work-in-progress features.
- `.gitignore` – Specifies ignored files.

💡 If you need a setup template, feel free to contact me on Discord: [DC: nixkuchen].

## Documentation

Currently, no official documentation is available. However, you can explore the bot’s functionality yourself or contact [DC: nixkuchen] for guidance.

## Unused Discord Bot Files

Files located in `./_app/*` are for Discord server setup (e.g., images).

## Versions

The bot is fully functional with the following package versions:
```json
"@discordjs/voice": "^0.18.0",        // [25.02.2026]
"chartjs-node-canvas": "^5.0.0",      // [25.02.2026]
"chrome-remote-interface": "^0.33.3", // [25.02.2026]
"discord-simpletable": "^1.1.6",      // [25.02.2026]
"discord.js": "^14.25.1",             // [25.02.2026]
"dotenv": "^17.2.3",                  // [25.02.2026]
"libsodium-wrappers": "^0.8.0",       // [25.02.2026]
"mongo": "^0.1.0",                    // [25.02.2026]
"node-fetch": "2.6.12",               // [25.02.2026] (@latest 3.3.2)
"node-schedule": "^2.1.1",            // [25.02.2026]
"puppeteer": "^23.11.1"               // [25.02.2026] (@latest 24.37.5) - unused and outdated
```

Tips:

- Run `npm outdated` to check which packages can be updated
- Run `npm update <package-name>` to update a single package

or use the build in script

- npm run outdated

## Commit Naming Conventions

- `wip` – Work in progress.
- `todo` – Task that needs to be completed.
- `readme` – README updates.
- `naming` – Renaming constants, variables, or text.
- `v/version` – Version updates in package.json.

## What does ... mean?

- uptodate15: This means the message will be updated when changes occur up to 15 more minutes after the interaction execution.

## Code Quality & Development Philosophy
Software is always evolving, and CodeZero is no exception. Here’s why code may sometimes appear incomplete or unpolished:

1. Rapid Development: The goal is to ensure functionality first.
2. Changing Requirements: Features are frequently adjusted to meet new needs.
3. Ongoing Refinements: Code is continuously improved for efficiency and maintainability.
4. Organized Messiness: While some sections may seem unstructured, they function correctly. Any outstanding issues are documented in TODO (index.js).
5. Fast-Paced Changes: In the early stages, speed often takes priority over perfection.

Since CodeZero is actively in development, expect ongoing improvements and changes.
## Nicusch Versioning System (NVS)
- `0.0.1` – Minor bug fixes or small functional improvements.
- `0.1.0` – Command modifications or updates that impact functionality.
- `1.0.0` – Major changes affecting class structures and breaking compatibility.

💡 This system has been in use since 10.07.2024, but earlier commits may not follow it consistently.
## Know issues

- 📱 Mobile UI Bug: Tables, charts and Progress Bar's do not display correctly on mobile devices, but there are currently no plans to fix it soon, and it may remain unresolved indefinitely  (Reported: 01.01.2025).