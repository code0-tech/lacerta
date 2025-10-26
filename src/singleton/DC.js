const Constants = require('./../../data/constants');
const { ChannelType } = require('discord.js');
const config = require('./../../config.json');
const { MessageFlags } = require('discord.js')

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
    * Remove all perm overrides
    */
    static async removeChannelUserOverrides(channel) {
        const permissionOverwrites = channel.permissionOverwrites.cache;
        const type1Overwrites = permissionOverwrites.filter(overwrite => overwrite.type === Constants.DISCORD.PERMS.USER_OVERRIDE);

        let removedIds = [];

        [...type1Overwrites.keys()].forEach(userId => {
            removedIds.push(userId);
            channel.permissionOverwrites.delete(userId);
        });

        console.log(`[DC.channelPerms] User Perms removed from "${channel.name}"`, Constants.CONSOLE.WORKING);
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

}


module.exports = DC;