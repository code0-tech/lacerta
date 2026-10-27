const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require("../../data/constants");
const config = require('./../../config.json');
const { Events } = require('discord.js');
const DC = require('./../singleton/DC');

const mongoDb = new Mongo();

const channelSLIPConfig = config.modules.channelAutoSlowmo;

let channelMessageStats = {};

const activateSlowmo = async (channelId, client) => {
    const now = Date.now();

    const doc = await mongoDb.findOne(
        ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
        { channelId }
    );

    if (!doc) {
        await mongoDb.insertOne(
            ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
            {
                channelId,
                slowmode: true,
                since: now,
                lastSlipAt: now,
                timesSlowed: 1
            }
        );
        console.log(`[ChannelSlowmo::Info] Channel ${channelId} slowmode activated (New record created)`, Constants.CONSOLE.INFO);
    } else if (!doc.slowmode) {
        await mongoDb.update(
            ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
            { channelId },
            {
                $set: {
                    slowmode: true,
                    since: now,
                    lastSlipAt: now
                },
                $inc: { timesSlowed: 1 }
            }
        );
        console.log(`[ChannelSlowmo::Info] Channel ${channelId} slowmode activated (Existing record updated)`, Constants.CONSOLE.INFO);
    } else {
        // already slowed => refresh decay timer
        await mongoDb.update(
            ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
            { channelId },
            { $set: { lastSlipAt: now } }
        );
        console.log(`[ChannelSlowmo::Info] Channel ${channelId} already slowed, refreshed decay timer`, Constants.CONSOLE.INFO);
    }

    const channel = await DC.channelByIdOnly(channelId, client);
    if (channel) {
        await channel.setRateLimitPerUser(channelSLIPConfig.slowmodeInSeconds).catch((err) => {
            console.log(`[ChannelSlowmo::RateLimit] Failed to set rate limit on channel ${channelId}: ${err.message}`, Constants.CONSOLE.ERROR);
        });
    }
};

const disableSlowmo = async (channelId, client) => {
    await mongoDb.update(
        ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
        { channelId },
        { $set: { slowmode: false } }
    );

    const channel = await DC.channelByIdOnly(channelId, client);
    if (channel) {
        await channel.setRateLimitPerUser(0).catch((err) => {
            console.log(`[ChannelSlowmo::RateLimit] Failed to reset rate limit on channel ${channelId}: ${err.message}`, Constants.CONSOLE.ERROR);
        });
    }
    console.log(`[ChannelSlowmo::Channel-Info] Channel ${channelId} slowmode disabled (decay reached)`, Constants.CONSOLE.INFO);
};

const checkSlowmoDecay = async (client) => {
    const now = Date.now();

    const slowedChannels = await mongoDb.find(ENUMS.DCB.AUTO_SLOWMO_CHANNELS, { slowmode: true });

    for (const doc of slowedChannels) {
        if (now - doc.lastSlipAt >= channelSLIPConfig.slowmodeTime) {
            await disableSlowmo(doc.channelId, client);
        }
    }
};

const loadSlowedChannels = async (client) => {
    const slowed = await mongoDb.find(ENUMS.DCB.AUTO_SLOWMO_CHANNELS, { slowmode: true });
    console.log(`[ChannelSlowmo::Channels] Loading ${slowed.length} active slowmode channels from database...`, Constants.CONSOLE.INFO);

    for (const doc of slowed) {
        const channel = await DC.channelByIdOnly(doc.channelId, client);
        if (channel) {
            await channel.setRateLimitPerUser(channelSLIPConfig.slowmodeInSeconds).catch((err) => {
                console.log(`[ChannelSlowmo::RateLimit] Failed to apply rate limit on load for ${doc.channelId}: ${err.message}`, Constants.CONSOLE.ERROR);
            });
        }
    }
};

const updateSlip = (channelId, timeNow, client) => {
    const stats = channelMessageStats[channelId];
    if (!stats) return;

    if (!stats.lastSlipUpdate) {
        stats.lastSlipUpdate = timeNow;
        stats.newMsg = 0;
        return;
    }

    const dt = (timeNow - stats.lastSlipUpdate) / 1000;
    if (dt <= 0) return;

    stats.lastSlipUpdate = timeNow;

    let activeParticipants = 0;
    for (const userId in stats.participants) {
        if (timeNow - stats.participants[userId].lastMessage <= channelSLIPConfig.isActiveParticipant) {
            activeParticipants++;
        }
    }

    stats.SLIP += channelSLIPConfig.divSlip * dt;

    if (activeParticipants >= channelSLIPConfig.minParticipants && stats.newMsg > 0) {
        const msgPressure =
            stats.newMsg *
            channelSLIPConfig.msgSlip *
            (activeParticipants * channelSLIPConfig.participantsMultiplier);

        stats.SLIP += msgPressure;
    }

    if (stats.SLIP < 0) stats.SLIP = 0;
    stats.newMsg = 0;

    if (stats.SLIP >= channelSLIPConfig.slowmoAtSlip) {
        console.log(`[ChannelSlowmo::SLIP-Info] SLIP threshold reached (${stats.SLIP.toFixed(2)} >= ${channelSLIPConfig.slowmoAtSlip}) for channel ${channelId}`, Constants.CONSOLE.GOOD);
        activateSlowmo(channelId, client);
        stats.SLIP = 0;
    }
};

const start = (client) => {
    console.log(`[ChannelSlowmo::Starting] Starting auto-slowmo module...`, Constants.CONSOLE.INFO);
    loadSlowedChannels(client);
    checkSlowmoDecay(client);

    setInterval(() => {
        checkSlowmoDecay(client);
    }, 60_000);

    client.on(Events.MessageCreate, async msg => {
        if (msg.author.bot || msg.author.system) return;

        if (!DC.canEveryoneWriteInChannel(msg.channel)) return;

        if (!channelMessageStats[msg.channelId]) {
            channelMessageStats[msg.channelId] = {
                participants: {},
                totalMsg: 0,
                newMsg: 0,
                SLIP: 0,
                lastStateSince: Date.now()
            };
        }

        const channelStats = channelMessageStats[msg.channelId];

        if (!channelStats.participants[msg.author.id]) {
            channelStats.participants[msg.author.id] = {
                lastMessage: Date.now(),
                msgCount: 0
            };
        }

        channelStats.totalMsg++;
        channelStats.newMsg++;
        channelStats.lastStateSince = Date.now();

        channelStats.participants[msg.author.id].msgCount++;
        channelStats.participants[msg.author.id].lastMessage = Date.now();

        updateSlip(msg.channelId, Date.now(), client);
    });
};

module.exports = { start };