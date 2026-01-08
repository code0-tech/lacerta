const Constants = require('../../data/constants');
const config = require('../../config.json');
const DC = require('../singleton/DC');

const fetch = async (client) => {
    const guild = await DC.guildById(config.serverId, client);

    const channels = await guild.channels.fetch();
    console.log(`[Pre-Fetch] Fetched ${channels.size} channels in guild ${guild.name}.`, Constants.CONSOLE.FOUND);
};

module.exports = { fetch };