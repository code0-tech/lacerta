const { Embed, COLOR, progressBar } = require('../models/Embed');
const { levenshteinDistance } = require('../utils/helper');
const { MongoUser } = require('../mongo/MongoUser');
const config = require('../../config.json');
const { Events } = require('discord.js');
const DC = require('../singleton/DC');

let userList = {};

const newPacket = (msg) => {
    return {
        last: {
            content: msg.content,
            length: msg.content.length,
            time: Date.now(),
            minMessageWriteTime: (msg.content.length / 10),
            messagePartsCount: msg.content.split(" ").length
        }
    }
};

const checkIfValid = async (msg) => {
    let inValid = false;
    let info = [];
    const userId = msg.author.id;

    if (!userList[userId]) {
        userList[userId] = newPacket(msg);
        return { inValid, info: info };
    }

    const repeatedChars = /(.)\1{3,}/;
    if (repeatedChars.test(msg.content)) {
        info.push('Unusual character repetition');
        inValid = true;
    }

    if (msg.content == userList[userId].last.content) {
        info.push('Repeated message');
        inValid = true;
    }

    const contentToLastDistance = levenshteinDistance(msg.content, userList[userId].last.content);
    info.push(`Levenshtein Distance: ${contentToLastDistance}`);
    if (contentToLastDistance < 3) {
        info.push('Repeated message [similar]');
        inValid = true;
    }

    const timeSpan = (Date.now() - userList[userId].last.time);
    info.push(`Ms between this/last msg: ${timeSpan}`);
    if (timeSpan <= 900) {
        info.push('Quick messages v1');
        inValid = true;
    }

    userList[userId] = newPacket(msg);

    return { inValid, info: info };
};

const channelRankUpdateMessage = async (client, user) => {
    const guild = await DC.guildById(config.serverid, client);
    const rankMember = await guild.members.fetch(await user.getId());

    const { level, neededXp } = await user.getRank();
    const position = await user.getXpGlobalPosition();

    const xp = 0;

    new Embed()
        .setColor(COLOR.INFO)
        .setPbThumbnail(rankMember)
        .addInputs({
            rankuserid: await user.getId(),
            level,
            neededXp,
            xp,
            progressbar: progressBar(xp, neededXp),
            position
        })
        .addContext({ text: client.languages.english['#_rankupdate'] }, null, '#update-msg')
        .responseToChannel(config.channels.rankupdates, client)
};

const start = (client) => {
    const maxLength = config.commands.rank.maxlength;
    const maxXP = config.commands.rank.maxxp;
    const xpPerChar = config.commands.rank.xpperchar;

    client.on(Events.MessageCreate, async msg => {

        if (msg.author.bot == true) return;
        if (msg.author.system == true) return;

        const check = await checkIfValid(msg);

        if (check.inValid) return;

        const user = await new MongoUser(msg.author.id).init();

        const previousLevel = (await user.getRank()).level;

        const adjustedLength = Math.min(msg.content.length, maxLength);

        let xp = Math.floor(adjustedLength * xpPerChar);

        xp = Math.min(xp, maxXP);

        if (xp == 0 && msg.content.length > 1) {
            xp = 1;
        }

        await user.updateXpBy(xp);

        const lastLevel = (await user.getRank()).level;

        if (lastLevel !== previousLevel) {
            channelRankUpdateMessage(client, user);
        }
    })
};

module.exports = { start };