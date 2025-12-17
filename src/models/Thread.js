const { ChannelType, ThreadAutoArchiveDuration } = require("discord.js");
const Constants = require("../../data/constants");

class Thread {
    constructor() {
        /** @type {Object} */
        this._threadObj = {
            name: 'new-thread',
            type: ChannelType.PrivateThread,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        };

        this._membersToAdd = [];
        this._rolesToAdd = [];
    }

    /**
     * Set the name of the thread.
     * @param {string} name 
     * @returns {Thread}
     */
    setName(name) {
        this._threadObj.name = name;
        return this;
    }

    /**
     * Set the type (Private or Public).
     * @param {ChannelType.GuildPrivateThread | ChannelType.GuildPublicThread} type 
     * @returns {Thread}
     */
    setType(type) {
        this._threadObj.type = type;
        return this;
    }

    /**
     * Set how long of inactivity before the thread archives.
     * @param {ThreadAutoArchiveDuration} duration 
     * @returns {Thread}
     */
    setAutoArchiveDuration(duration) {
        this._threadObj.autoArchiveDuration = duration;
        return this;
    }

    /**
     * Add a specific user ID to be added silently upon creation.
     * @param {string} userId 
     * @returns {Thread}
     */
    addMemberById(userId) {
        this._membersToAdd.push(userId);
        return this;
    }

    /**
     * Add a role ID to be "Ghost Mentioned" upon creation.
     * @param {string} roleId 
     * @returns {Thread}
     */
    addRole(roleId) {
        this._rolesToAdd.push(roleId);
        return this;
    }

    /**
     * Create the thread in the target channel.
     * @param {TextChannel | NewsChannel} channel - The parent channel.
     * @returns {Promise<ThreadChannel>}
     */
    async createThread(channel) {
        const thread = await channel.threads.create(this._threadObj);

        if (this._membersToAdd.length > 0) {
            for (const userId of this._membersToAdd) {
                try {
                    await thread.members.add(userId);
                } catch (e) {
                    console.log(`[Discord Thread] Failed to silently add user ${userId}`, Constants.CONSOLE.ERROR);
                }
            }
        }

        if (this._rolesToAdd.length > 0) {
            const mentionString = this._rolesToAdd.map(id => `<@&${id}>`).join(' ');
            const msg = await thread.send(mentionString);
            await msg.delete();
        }

        console.log(`[Discord Thread] Created new thread "${thread.name}" in #${channel.name}`, Constants.CONSOLE.GOOD);
        return thread;
    }
}

module.exports = { Thread };