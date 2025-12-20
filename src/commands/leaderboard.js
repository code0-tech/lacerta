const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordSimpleTable = require('discord-simpletable');
const { MongoUser } = require('./../mongo/MongoUser');
const { humanizeNumber } = require('../utils/helper');
const { Mongo, ENUMS } = require('../models/Mongo');
const { Embed, COLOR } = require('../models/Embed');
const Constants = require('../../data/constants');
const config = require('../../config.json');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the leaderboard of top users.')
    .setDescriptionLocalizations({
        de: 'Leaderboard der top Nutzer.',
    })
    .addIntegerOption(option =>
        option
            .setName('limit')
            .setDescription('Specify the number of users to display (1-20).')
            .setDescriptionLocalizations({
                de: 'Anzahl der angezeigten Nutzern im Leaderboard (1-20).',
            })
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false)
    );


const listUser = async (limit) => {
    const list = await MongoDb.aggregate(ENUMS.DCB.USERS, [
        { $sort: { rawxp: Constants.MONGO.SORT.DESC } },
        { $limit: limit }
    ])

    return list;
};

const sendMessage = async (interaction, member, lang, data) => {
    const columns = [
        { label: lang.getText('username'), key: 'name' },
        { label: lang.getText('level'), key: 'lvl' },
        { label: lang.getText('xp'), key: 'xp' }
    ];

    const buildTable = new DiscordSimpleTable(columns)
        .setJsonArrayInputs(data)
        .setStringOffset(2)
        .addVerticalBar()
        .addIndex(1)
        .build();

    new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ stringlist: buildTable })
        .addContext(lang, member, 'board')
        .interactionResponse(interaction);
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, lang } = dcInteraction;

    await DC.defer(interaction);

    const limit = interaction.options.getInteger('limit') ?? config.commands.leaderboard.baselistlimit;

    const userList = await listUser(limit);

    let data = [];

    const mongoUser = new MongoUser();

    for (let i = 0; i < userList.length; i++) {
        const user = userList[i];

        let leadboardMember = await DC.memberById(user.id, guild);

        if (leadboardMember == undefined) {
            leadboardMember = { nickname: `[${lang.getText('left-server')}]` };
        }

        if (user.rawxp == 0) return;

        const { level, neededXp, xp } = await mongoUser._getLvlAndXpByRawXp(user.rawxp);

        let username = leadboardMember.nickname == null ? leadboardMember.user.username : leadboardMember.nickname;

        if (username.length > config.commands.leaderboard.maxnamelength) {
            username = username.substring(0, (config.commands.leaderboard.maxnamelength - 3)) + "...";
        }

        data.push({ name: username, lvl: humanizeNumber(level), xp: `[${humanizeNumber(xp)}|${humanizeNumber(neededXp)}]` });

        if ((i + 1) % 5 == 0) {
            sendMessage(interaction, member, lang, data);
        }
    }

    sendMessage(interaction, member, lang, data);
};

module.exports = { execute, data };