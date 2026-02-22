const Constants = require('./../../data/constants');
const { MessageFlags } = require('discord.js');
const { ChannelType } = require('discord.js');
const config = require('./../../config.json');

class DC {
    // Interactions options
    /**
    * Defer the reply
    */
    static async defer(interaction, ephemeral = true) {
        if (interaction == undefined) {
            console.log(`[DC.defer] Interaction was not defined`, Constants.CONSOLE.ERROR);
            return;
        }

        const options = ephemeral ? { flags: MessageFlags.Ephemeral } : undefined;

        return await interaction.deferReply(options);
    }

    // Member

    /**
    * Get Member only by UserId
    */
    static async codeZeroMemberById(userId, client) {
        try {
            const guild = await this.guildById(config.server.id, client);
            let member = guild.members.cache.get(userId);

            if (member) {
                console.log(`[DC.memberById] UserId ${userId} found in cache`, Constants.CONSOLE.FOUND);
            } else {
                member = await guild.members.fetch(userId);
                console.log(`[DC.memberById] UserId ${userId} fetched from API`, Constants.CONSOLE.FOUND);
            }

            return member;
        } catch (err) {
            console.log(`[DC.memberById] Cannot find userId ${userId}`, Constants.CONSOLE.ERROR);
            return undefined;
        }
    }

    /**
    * Get Member by UserId
    */
    static async memberById(userId, guild) {
        try {
            let member = guild.members.cache.get(userId);

            if (member) {
                console.log(`[DC.memberById] UserId ${userId} found in cache`, Constants.CONSOLE.FOUND);
            } else {
                member = await guild.members.fetch(userId);
                console.log(`[DC.memberById] UserId ${userId} fetched from API`, Constants.CONSOLE.FOUND);
            }

            return member;
        } catch (err) {
            console.log(`[DC.memberById] Cannot find userId ${userId}`, Constants.CONSOLE.ERROR);
            return undefined;
        }
    }

    // User
    /**
     * Get User by UserId from the client.
     */
    static async userById(userId, client) {
        try {
            let user = client.users.cache.get(userId);
            if (!user) {
                user = await client.users.fetch(userId);
            }
            return user;
        } catch (err) {
            console.log(`[DC.userById] Cannot find userId ${userId}`, Constants.CONSOLE.ERROR);
            return undefined;
        }
    }

    /**
    * Check if the Member has the Team role
    */
    static async isTeamMember(member) {
        return await member.roles.cache.has(config.roles.team);
    }

    /**
    * Check if the Member has a roleId
    */
    static async memberHasRole(member, roleId) {
        return await member.roles.cache.has(roleId);
    }

    /**
    * Check if the Member is in a voice channel
    */
    static async memberVoiceChannel(member) {
        if (member.voice.channel) {
            return member.voice.channel;
        } else {
            return null;
        }
    }

    /**
    * Add a role to a Member by the roleId
    */
    static async memberAddRoleId(member, roleId) {
        return member.roles.add(roleId);
    }

    /**
    * Check if a Member has a role by roleId
    */
    static memberHasRoleId(member, roleId) {
        return member.roles.cache.has(roleId);
    }

    /**
    * Remove a Members role by roleId
    */
    static async memberRemoveRoleId(member, roleId) {
        return member.roles.remove(roleId);
    }

    /**
    * Get channel by id only
    */
    static async channelByIdOnly(channelId, client) {
        try {
            let channel = client.channels.cache.get(channelId);

            if (channel) {
                console.log(
                    `[DC.channelByIdOnly] ChannelId ${channelId} found in cache`,
                    Constants.CONSOLE.FOUND
                );
                return channel;
            }

            channel = await client.channels.fetch(channelId);
            console.log(
                `[DC.channelByIdOnly] ChannelId ${channelId} fetched from API`,
                Constants.CONSOLE.FOUND
            );

            return channel;
        } catch (err) {
            console.log(
                `[DC.channelByIdOnly] Cannot find channel ${channelId}`,
                Constants.CONSOLE.ERROR
            );
            return undefined;
        }
    }

    // Channel
    /**
    * Get all channels inside a guild
    */
    static async channelsByGuild(guild) {
        return await guild.channels.fetch();
    }

    /**
    * Get a channels under a parent id
    */
    static async channelsByParentId(parentId, guild) {
        try {
            const allChannels = guild.channels.cache;
            const channelsInCategory = allChannels.filter(channel => channel.parentId === parentId);
            console.log(`[DC.channelsByParentId] Channels for parentId ${parentId} found in cache`, Constants.CONSOLE.FOUND);
            return channelsInCategory;
        } catch (err) {
            console.log(`[DC.channelsByParentId] Cannot find channels for parentId ${parentId}`, Constants.CONSOLE.ERROR);
            return undefined;
        }
    }

    /**
    * Get a channel by its id
    */
    static async channelById(channelId, guild) {
        try {
            let channel = guild.channels.cache.get(channelId);

            if (channel) {
                console.log(`[DC.channelById] ChannelId ${channelId} found in cache`, Constants.CONSOLE.FOUND);
            } else {
                channel = await guild.channels.fetch(channelId);
                console.log(`[DC.channelById] ChannelId ${channelId} fetched from API`, Constants.CONSOLE.FOUND);
            }

            return channel;
        } catch (err) {
            console.log(`[DC.channelById] Cannot find channelId ${channelId}`, Constants.CONSOLE.ERROR);
            return undefined;
        }
    }

    /**
    * Get the channel in which the interaction takes place
    */
    static channelByInteraction(interaction, guild) {
        const channel = guild.channels.cache.get(interaction.message.channelId);
        return channel;
    }

    /**
     * Check if a channel is a Text Channel.
     */
    static isTextChannel(channel) {
        return channel.type === ChannelType.GuildText;
    }

    /**
     * Check if a channel is a Voice Channel.
     */
    static isVoiceChannel(channel) {
        return channel.type === ChannelType.GuildVoice;
    }

    /**
    * Remove all perm overrides
    */
    static async removeChannelUserOverrides(channel) {
        const permissionOverwrites = channel.permissionOverwrites.cache;
        const type1Overwrites = permissionOverwrites.filter(overwrite => overwrite.type === Constants.DISCORD.PERMS.USER_OVERRIDE);

        let removedIds = [];

        console.log(`[DC.channelPerms] User Perms removing from "${channel.name}"`, Constants.CONSOLE.WORKING);

        [...type1Overwrites.keys()].forEach(userId => {
            removedIds.push(userId);
            channel.permissionOverwrites.delete(userId);
        });

        console.log(`[DC.channelPerms] User Perms removed from "${channel.name}"`, Constants.CONSOLE.GOOD);
        return { removedIds };
    }

    // Messages
    /**
    * Get all messages by Channel (hard limit to 100)
    */
    static async messagesByChannel(channel, fetchLimit = 100) {
        return await channel.messages.fetch({ limit: fetchLimit });
    }

    /**
    * Get messages from channel
    */
    static async messagesFromChannel(client, serverid, channelid, fetchLimit = 100) {
        const guild = await this.guildById(serverid, client);
        const channel = await this.channelById(channelid, guild);
        const messages = await this.messagesByChannel(channel, fetchLimit);

        return messages;
    }

    // Guild
    /**
    * Get guild by id
    */
    static async guildById(guildId, client) {
        return await client.guilds.fetch(guildId);
    }

    /**
    * Mention a User by id
    */
    static mentionUser(userId) {
        return `<@${userId}>`;
    }

    /**
    * Mention a Role by id
    */
    static mentionRole(roleId) {
        return `<@&${roleId}>`;
    }

    /**
    * Mention a Channel by id
    */
    static mentionChannel(channelId) {
        return `<#${channelId}>`;
    }

    /**
    * Can @everyone send messages in this channel
    */
    static canEveryoneWriteInChannel(channel) {
        try {
            if (!channel || !channel.guild) return false;

            const everyoneRole = channel.guild.roles.everyone;
            const permissions = channel.permissionsFor(everyoneRole);
            if (!permissions) return false;

            return (
                permissions.has('ViewChannel') &&
                permissions.has('SendMessages')
            );
        } catch (err) {
            return false;
        }
    }

    /**
     * Scans a channel and returns ALL threads a specific user belongs to.
     * @returns {Promise<ThreadChannel[]>} - An array of thread objects.
     */
    static async findAllThreadsByUserMembershipInsideAParentChannel(parentChannel, userId) {
        const fetched = await parentChannel.threads.fetchActive();
        const activeThreads = fetched.threads;

        const userThreads = [];

        for (const [id, thread] of activeThreads) {
            const members = await thread.members.fetch();

            if (members.has(userId)) {
                userThreads.push(thread);
            }
        }

        return userThreads;
    }

    // Emojis & Reactions
    /**
     * React to a message with a sequence of emojis (waits for each to maintain order)
     */
    static async addEmojiSequence(message, emojis) {
        const applied = [];
        try {
            for (const emoji of emojis) {
                await message.react(emoji);
                applied.push(emoji);
            }
            console.log(`[DC] added emojis`, Constants.CONSOLE.GOOD);
        } catch (err) {
            console.log(`[DC.addEmojiSequence] Error adding: ${err.message}`, Constants.CONSOLE.ERROR);
        }
        return applied;
    }

    /**
     * Remove the bot's specific reaction from a message
     */
    static async removeBotReaction(message, emoji) {
        try {
            const reaction = message.reactions.cache.get(emoji) ||
                await message.reactions.resolve(emoji);

            if (reaction) {
                await reaction.users.remove(message.client.user.id);
                console.log(`[DC] remove emoji from message`, Constants.CONSOLE.GOOD);
                return true;
            }
        } catch (err) {
            // Usually occurs if message was deleted
            return false;
        }
        return false;
    }

    /**
     * Check if a message has a specific emoji reaction
     */
    static hasReaction(message, emoji) {
        console.log(`[DC] check emoji on message`, Constants.CONSOLE.GOOD);
        return message.reactions.cache.has(emoji);
    }

    /**
     * Combined logic: React and then auto-remove after XXXX ms
     */
    static async reactAndAutoRemove(message, emojis, delay = 5000) {
        const applied = await this.addEmojiSequence(message, emojis);

        setTimeout(async () => {
            for (const emoji of applied) {
                await this.removeBotReaction(message, emoji);
            }
        }, delay);
    }

    /**
     * Check voice state by dif of oldState and newState
     */
    static checkVoiceStateChange(oldState, newState) {
        let userId = newState.member ? newState.member.id : oldState.member.id;
        let newUserChannel = newState.channel;
        let oldUserChannel = oldState.channel;

        // 1. Check for Channel Join
        if (oldUserChannel === null && newUserChannel !== null) {
            return { state: Constants.DC_ENUMS.VOICE.CHANNEL_JOIN, userId, newChannel: newUserChannel, oldChannel: oldUserChannel };
        }

        // 2. Check for Channel Leave
        if (oldUserChannel !== null && newUserChannel === null) {
            return { state: Constants.DC_ENUMS.VOICE.CHANNEL_LEAVE, userId, newChannel: newUserChannel, oldChannel: oldUserChannel };
        }

        // 3. Check for Channel Switch
        if (oldUserChannel !== null && newUserChannel !== null && oldUserChannel.id != newUserChannel.id) {
            return { state: Constants.DC_ENUMS.VOICE.CHANNEL_SWITCH, userId, newChannel: newUserChannel, oldChannel: oldUserChannel };
        }

        // 4. Mute / Unmute
        if (oldState.selfMute !== newState.selfMute) {
            return {
                state: newState.selfMute ? Constants.DC_ENUMS.VOICE.MUTE_ON : Constants.DC_ENUMS.VOICE.MUTE_OFF,
                userId, newChannel: newUserChannel, oldChannel: oldUserChannel
            };
        }

        // 5. Deaf / Undeaf
        if (oldState.selfDeaf !== newState.selfDeaf) {
            return {
                state: newState.selfDeaf ? Constants.DC_ENUMS.VOICE.DEAF_ON : Constants.DC_ENUMS.VOICE.DEAF_OFF,
                userId, newChannel: newUserChannel, oldChannel: oldUserChannel
            };
        }

        // 6. Stream Start / Stop
        if (oldState.streaming !== newState.streaming) {
            return {
                state: newState.streaming ? Constants.DC_ENUMS.VOICE.STREAM_ON : Constants.DC_ENUMS.VOICE.STREAM_OFF,
                userId, newChannel: newUserChannel, oldChannel: oldUserChannel
            };
        }

        // 7. No significant change (e.g., server mute, volume change)
        return {
            state: Constants.DC_ENUMS.VOICE.CHANNEL_UNCHANGED,
            userId,
            newChannel: newUserChannel,
            oldChannel: oldUserChannel
        };
    }
};

module.exports = DC;