const { Mongo, ENUMS } = require('../models/Mongo');
const { Events } = require('discord.js');
const DC = require('./../singleton/DC');
const config = require('./../../config.json');

const mongoDb = new Mongo();

const channelSLIPConfig = config.modules.channelautoslowmo;

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
    } else {
        // already slowed => refresh decay timer
        await mongoDb.update(
            ENUMS.DCB.AUTO_SLOWMO_CHANNELS,
            { channelId },
            { $set: { lastSlipAt: now } }
        );
    }

    const channel = await DC.channelByIdOnly(channelId, client);
    DC.channelByChannelId
    if (channel) {
        await channel.setRateLimitPerUser(channelSLIPConfig.slowmodeInSeconds).catch(() => { });
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
        await channel.setRateLimitPerUser(0).catch(() => { });
    }
};

const checkSlowmoDecay = async (client) => {
    const now = Date.now();

    const slowedChannels = await mongoDb.find(ENUMS.DCB.AUTO_SLOWMO_CHANNELS, { slowmode: true });

    for (const doc of slowedChannels) {
        if (now - doc.lastSlipAt >= channelSLIPConfig.slowmodeTime) {
            await disableSlowmo(doc.channelId, client);
        }
        console.log(now - doc.lastSlipAt)
    }
};

const loadSlowedChannels = async (client) => {
    const slowed = await mongoDb.find(ENUMS.DCB.AUTO_SLOWMO_CHANNELS, { slowmode: true });

    for (const doc of slowed) {
        const channel = await DC.channelByIdOnly(doc.channelId, client);
        if (channel) {
            await channel.setRateLimitPerUser(channelSLIPConfig.slowmodeInSeconds).catch(() => { });
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
        activateSlowmo(channelId, client);
        stats.SLIP = 0;
    }
};

const start = (client) => {
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