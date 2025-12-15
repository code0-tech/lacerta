const start = async (args) => {

    require('./src/start-up/update-console-log');
    require('./src/start-up/process-exit');

    const Constants = require('./data/constants');

    const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
    const dotenv = require('dotenv');
    const os = require('os');

    const isServer = os.platform() !== 'win32';
    global.isDevelopment = !isServer;

    dotenv.config({ path: global.isDevelopment ? '.env' : 'server.env' });

    global.mainDir = __dirname;
    global.mongoClient = null;

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildScheduledEvents
        ], partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ]
    });

    client.startDate = Date.now();

    require('./src/dc-client/load-languages').load(client);
    require('./src/dc-client/language-file-check');
    await require('./src/start-up/mongo-setup').connect();

    // require('./src/start-up/start-puppeteer');
    require('./src/web-server/http-server').setup(client);

    client.once(Events.ClientReady, readyClient => {

        require('./src/dc-guild/discord-fetch').fetch(client);

        require('./src/interactions/load-interactions').load(client);

        require('./src/start-up/mongodb-check');

        require('./src/dc-client/client-status').start(client);

        console.log(`\nCode0 Discord Client ready => ${readyClient.user.tag}`, Constants.CONSOLE.GOOD);

        require('./src/dc-guild/stats-message').start(client);
        require('./src/dc-guild/stats-voice-channel').start(client);

        require('./src/dc-guild/webhook-commit-filter').start(client);

        require('./src/dc-guild/auto-slowmo').start(client);

        require('./src/dc-guild/user-stats').start(client);

        require('./src/dc-guild/git-rank').setup(client);

        require('./src/dc-guild/event-prereminder').setupEventMessages(client);

    });

    require('./src/dc-client/debug-log').setup(client);

    client.login(process.env.TOKEN);
};

start();