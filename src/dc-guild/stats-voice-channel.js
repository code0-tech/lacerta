const { Events, ChannelType } = require('discord.js');
const { MongoUser } = require('../mongo/MongoUser');
const Constants = require('../../data/constants');
const config = require('../../config.json');
const DC = require('../singleton/DC');

let voiceChatUser = {};

const validateActiveStatus = (member) => {
    const s = member.voice;
    const channel = s.channel;
    if (!channel) return false;

    if (s.selfDeaf || s.selfMute) return false;

    const unmutedMembers = channel.members.filter(m => !m.voice.selfMute && !m.user.bot);
    return unmutedMembers.size >= 2;
};

const updateDb = async (client, userId, packet) => {
    if (!voiceChatUser[userId]) return;

    const user = await new MongoUser().userById(userId);
    const guild = await DC.guildById(process.env.GUILD_ID, client);
    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member) return;

    const timeInVoice = Date.now() - voiceChatUser[userId].since;
    if (timeInVoice < 1000) return;

    const seconds = Math.floor(timeInVoice / Constants.TIME_MULTIPLIER_MS.SECONDS);

    await user.updateVoiceStats({
        activeTime: validateActiveStatus(member) ? seconds : 0,
        _totalCalculated: seconds,
        joins: packet.join ? 1 : 0,
        switches: packet.switchs || 0,
        muteTime: member.voice.selfMute ? seconds : 0,
        deafTime: member.voice.selfDeaf ? seconds : 0,
        streamingTime: member.voice.streaming ? seconds : 0
    });

    voiceChatUser[userId].since = Date.now();
    voiceChatUser[userId].join = false;
    voiceChatUser[userId].switchs = 0;
};

const updateAllUsers = async (client) => {
    const userIds = Object.keys(voiceChatUser);
    for (const userId of userIds) {
        await updateDb(client, userId, voiceChatUser[userId]);
    }
};

const joinVoice = (client, userId) => {
    voiceChatUser[userId] = {
        since: Date.now(),
        switchs: 0
    }
};

const switchVoice = (client, userId) => {
    if (!voiceChatUser[userId]) {
        voiceChatUser[userId] = {
            since: client.startDate,
            switchs: 0
        }
    }

    voiceChatUser[userId].switchs++;
};

const leaveVoice = async (client, userId) => {
    if (!voiceChatUser[userId]) {
        voiceChatUser[userId] = {
            since: client.startDate,
            switchs: 0
        }
    }

    voiceChatUser[userId].join = true;

    await updateDb(client, userId, voiceChatUser[userId]);

    delete voiceChatUser[userId];
};

const handleToggle = async (client, userId) => {
    await updateDb(client, userId, voiceChatUser[userId]);
};

const start = async (client) => {
    const guild = await DC.guildById(config.serverId, client);
    if (guild) {
        const allChannels = await guild.channels.fetch();

        allChannels.forEach(channel => {
            if (channel.type === ChannelType.GuildVoice) {
                channel.members.forEach(member => {
                    if (!voiceChatUser[member.id]) {
                        console.log(`[Voice Stats] Pre-booting tracker for: ${member.user.tag}`, Constants.CONSOLE.FOUND);
                        joinVoice(client, member.id);
                    }
                });
            }
        });
    }

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const { state, userId } = DC.checkVoiceStateChange(oldState, newState);

        switch (state) {
            case Constants.DC_ENUMS.VOICE.CHANNEL_JOIN:
                joinVoice(client, userId);
                break;
            case Constants.DC_ENUMS.VOICE.CHANNEL_LEAVE:
                await leaveVoice(client, userId);
                break;
            case Constants.DC_ENUMS.VOICE.CHANNEL_SWITCH:
                switchVoice(client, userId);
                await handleToggle(client, userId);
                break;

            case Constants.DC_ENUMS.VOICE.MUTE_ON:
            case Constants.DC_ENUMS.VOICE.MUTE_OFF:
            case Constants.DC_ENUMS.VOICE.DEAF_ON:
            case Constants.DC_ENUMS.VOICE.DEAF_OFF:
            case Constants.DC_ENUMS.VOICE.STREAM_ON:
            case Constants.DC_ENUMS.VOICE.STREAM_OFF:
                await handleToggle(client, userId);
                break;

            default:
                break;
        }
    });

    setInterval(() => updateAllUsers(client), Constants.SETTINGS.VOICE_STATS.UPDATE_INTERVAL);
};

module.exports = { start };