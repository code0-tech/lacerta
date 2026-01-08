const start = async (args = {}) => {

    require('./src/start-up/update-console-log');
    require('./src/start-up/process-exit');

    const Constants = require('./data/constants');

    const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
    const dotenv = require('dotenv');
    const os = require('os');

    const isProductionServer = os.platform() !== Constants.NODE.PLATFROM.WINDOWS;
    global.isDevelopment = !isProductionServer;

    dotenv.config({ path: global.isDevelopment ? Constants.NODE.ENV.DEVELOPMENT : Constants.NODE.ENV.PRODUCTION });

    global.mainDir = __dirname;
    global.mongoClient = null;

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildScheduledEvents,
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

    if (args.withPuppeteer) require('./src/start-up/start-puppeteer');

    require('./src/web-server/http-server').setup(client);

    client.once(Events.ClientReady, readyClient => {

        require('./src/dc-guild/fetch-channels').fetch(client);

        require('./src/interactions/load-interactions').load(client);

        require('./src/start-up/mongodb-check');

        require('./src/dc-client/client-status').start(client);

        require('./src/dc-guild/stats-message').start(client);
        require('./src/dc-guild/stats-voice-channel').start(client);

        require('./src/dc-guild/webhook-commit-filter').start(client);

        require('./src/dc-guild/invite-tracker').start(client);

        require('./src/dc-guild/channel-auto-slowmo').start(client);

        require('./src/dc-guild/git-rank').setup(client);

        require('./src/dc-guild/event-prereminder').setupEventMessages(client);

        console.log(`\nCodeZero Discord Client ready => ${readyClient.user.tag}`, Constants.CONSOLE.GOOD);
    });

    require('./src/dc-client/debug-log').setup(client);

    client.login(process.env.TOKEN);
};

start(
    {
        // withPuppeteer: true
    }
);