const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const { Events } = require('discord.js');
const DC = require('../singleton/DC');

const mongo = new Mongo();
const voiceSessions = new Map();

async function updateStats(channelId, type, updateData) {
    const where = ENUMS.DCB.CHANNELS;
    const query = { channelId: channelId, type: type };

    try {
        await mongo.update(where, query, updateData, { upsert: true });
    } catch (error) {
        console.log(`[Guild-Stats] Error updating Mongo for ${channelId}`, Constants.CONSOLE.ERROR);
    }
};

async function updateVoiceChannelMetadata(channel) {
    if (!channel) return;

    const currentMemberCount = channel.members.size;

    const existing = await mongo.findOne(ENUMS.DCB.CHANNELS, {
        channelId: channel.id,
        type: Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.VOICE
    });

    const previousMax = existing?.maxUserCount || 0;

    const update = {
        $addToSet: { channelNames: channel.name },
        $set: {
            maxUserCount: Math.max(previousMax, currentMemberCount),
            lastUpdated: Date.now()
        }
    };

    await updateStats(channel.id, Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.VOICE, update);
};

const start = (client) => {
    console.log(`[Guild-Stats] Build untracked channel`, Constants.CONSOLE.GOOD);

    client.guilds.cache.forEach(async (guild) => {
        const channels = await DC.channelsByGuild(guild);

        channels.forEach(async (channel) => {
            const isVoice = DC.isVoiceChannel(channel);
            const type = isVoice ? Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.VOICE : Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.TEXT;

            const initialUpdate = {
                $addToSet: { channelNames: channel.name },
                $set: { lastUpdated: Date.now() },
                $setOnInsert: {
                    messageCount: 0,
                    totalVoiceSeconds: 0,
                    maxUserCount: isVoice ? channel.members.size : 0
                }
            };

            await updateStats(channel.id, type, initialUpdate);

            if (isVoice && channel.members.size > 0) {
                channel.members.forEach(member => {
                    if (!member.user.bot) {
                        voiceSessions.set(member.id, {
                            startTime: Date.now(),
                            channelId: channel.id
                        });
                    }
                });
            }
        });
    });

    client.on(Events.MessageCreate, async (msg) => {
        if (msg.author.bot || !msg.guild) return;

        const update = {
            $inc: { messageCount: 1 },
            $addToSet: { channelNames: msg.channel.name },
            $set: { lastUpdated: Date.now() }
        };

        await updateStats(msg.channelId, Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.TEXT, update);
    });

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const userId = newState.id;
        const channelId = newState.channelId;
        const oldChannelId = oldState.channelId;
        const member = newState.member;

        if (member?.user.bot) return;

        // Note: a function for this here exist in ../discord/voice.js <= but will be changed soon [11.01.2026]
        if (channelId && oldChannelId !== channelId) {
            voiceSessions.set(userId, {
                startTime: Date.now(),
                channelId: channelId
            });
            await updateVoiceChannelMetadata(newState.channel);
        }

        if (oldChannelId && oldChannelId !== channelId) {
            const session = voiceSessions.get(userId);

            if (session && session.channelId === oldChannelId) {
                const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);

                await updateStats(oldChannelId, Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.VOICE, {
                    $inc: { totalVoiceSeconds: durationSeconds },
                    $addToSet: { channelNames: oldState.channel.name },
                    $set: { lastUpdated: Date.now() }
                });
                voiceSessions.delete(userId);
            }
        }
    });
};

module.exports = { start };