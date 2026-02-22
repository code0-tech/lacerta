const Constants = require('../../data/constants');
const config = require('../../config.json');

const start = (client) => {
    const defaultMessages = config.bot.status.production;
    const developmentMessages = config.bot.status.development;
    let index = 0;

    setInterval(() => {
        const { name, status = Constants.DISCORD.STATUS.ONLINE } = global.isDevelopment ? developmentMessages[index++ % developmentMessages.length] : defaultMessages[index++ % defaultMessages.length];

        client.user.setPresence({ activities: [{ name }], status });
    }, config.bot.status.interval);
};

module.exports = { start };