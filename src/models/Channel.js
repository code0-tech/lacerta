const Constants = require('./../../data/constants');
const { ChannelType } = require("discord.js");

class Channel {
    constructor() {
        /** @type {Channel} */
        this._channelObj = {
            permissionOverwrites: []
        };
    }

    /**
    * Set the name of the channel.
    * @param {string} name - The name of the channel.
    * @returns {Channel} - The Channel instance for method chaining.
    */
    setName(name) {
        this._channelObj.name = name;
        return this;
    }

    /**
     * Set the ID of the parent category.
     * @param {string} parent - The ID of the parent category.
     * @returns {Channel} - The Channel instance for method chaining.
     */
    setParent(parent) {
        this._channelObj.parent = parent;
        return this;
    }

    /**
     * Set the type of the channel.
     * @param {string} [type=ChannelType.GuildText] - The type of the channel (defaults to GuildText).
     * @returns {Channel} - The Channel instance for method chaining.
     */
    setType(type) {
        this._channelObj.type = type || ChannelType.GuildText;
        return this;
    }

    /**
     * Set a permission overwrite for the channel.
     * @param {string} id - The ID of the user or role.
     * @param {string[]} [allow=[]] - The array of allowed permissions.
     * @param {string[]} [deny=[]] - The array of denied permissions.
     * @returns {Channel} - The Channel instance for method chaining.
     */
    setPermissionOverwrite(id, allow = [], deny = []) {
        const permissionOverwrite = {
            id: id,
            allow: allow,
            deny: deny,
        };

        this._channelObj.permissionOverwrites.push(permissionOverwrite);
        return this;
    }

    /**
    * Create the text channel with the specified parameters.
    * @param {Guild} guild - The guild in which to create the channel.
    * @returns {Promise<GuildChannel>} - A promise that resolves to the created channel.
    */
    async createChannel(guild) {
        const channel = await guild.channels.create(this._channelObj);
        console.log(`[Channel] Created new channel "${channel.name}"`, Constants.CONSOLE.WORKING);
        return channel;
    }
};

module.exports = { Channel };