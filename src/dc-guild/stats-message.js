const { Embed, COLOR, progressBar } = require('../models/Embed');
const { levenshteinDistance } = require('../utils/helper');
const { MongoUser } = require('../mongo/MongoUser');
const Constants = require('../../data/constants');
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

    console.log(`[LEVEL SYSTEM] user ${msg.author.id} got: ${info}`, Constants.CONSOLE.INFO)

    return { inValid, info: info };
};

const updateMemberLevelRole = async (member, level) => {
    const rolePaket = config.functions.rank.roles.find(r => r.r === level);

    if (!rolePaket) return;

    const targetRoleId = rolePaket.roleId;
    const allRankRoleIds = config.functions.rank.roles.map(r => r.roleId);

    allRankRoleIds
        .filter(rankRoleId => DC.memberHasRoleId(member, rankRoleId))
        .map(roleIdToRemove => {
            if (targetRoleId !== roleIdToRemove) return DC.memberRemoveRoleId(member, roleIdToRemove);
        });

    await DC.memberAddRoleId(member, targetRoleId);
};

const channelRankUpdateMessage = async (client, user) => {
    const guild = await DC.guildById(config.serverid, client);
    const rankMember = await DC.memberById(await user.getId(), guild);

    const { level, neededXp } = await user.getRank();
    const position = await user.getXpGlobalPosition();

    updateMemberLevelRole(rankMember, level);

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

const saveMessageStats = async (msg, mongoUser) => {
    const count = 1;
    const words = msg.content.split(" ").length;
    const chars = msg.content.length;

    mongoUser.updateMessageStats(count, words, chars);
}

const saveUserXp = async (msg, mongoUser) => {
    const maxLength = config.functions.rank.maxlength;
    const maxXP = config.functions.rank.maxxp;
    const xpPerChar = config.functions.rank.xpperchar;

    const adjustedLength = Math.min(msg.content.length, maxLength);

    let xp = Math.floor(adjustedLength * xpPerChar);

    xp = Math.min(xp, maxXP);

    if (xp == 0 && msg.content.length > 1) {
        xp = 1;
    }

    console.log(`[LEVEL SYSTEM] added ${xp} xp for ${msg.author.id}`, Constants.CONSOLE.GOOD);

    await mongoUser.updateXpBy(xp);
}

const start = (client) => {
    client.on(Events.MessageCreate, async msg => {

        if (msg.author.bot == true) return;
        if (msg.author.system == true) return;

        const mongoUser = await new MongoUser(msg.author.id).init();

        await saveMessageStats(msg, mongoUser);

        if ((await checkIfValid(msg)).inValid) return;

        const currentLevel = (await mongoUser.getRank()).level;

        await saveUserXp(msg, mongoUser);

        const newLevel = (await mongoUser.getRank()).level;

        if (newLevel !== currentLevel) {
            channelRankUpdateMessage(client, mongoUser);
        }
    })
};

module.exports = { start };