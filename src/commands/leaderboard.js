const { SlashCommandBuilder } = require('@discordjs/builders');
const { msToHumanReadableTime } = require('../utils/time');
const DiscordSimpleTable = require('discord-simpletable');
const { MongoUser } = require('./../mongo/MongoUser');
const { humanizeNumber } = require('../utils/helper');
const { Mongo, ENUMS } = require('../models/Mongo');
const { Embed, COLOR } = require('../models/Embed');
const Constants = require('../../data/constants');
const config = require('../../config.json');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const LEADERBOARD_TYPES = {
    xp: { field: 'rawxp', labelKey: 'xp' },
    messages: { field: 'stats.messages.count', labelKey: 'messages' },
    voice: { field: 'stats.voice.time', labelKey: 'voice_time' },
    invites: { field: 'stats.invites.real', labelKey: 'invites' }
};

const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the leaderboard of top users.')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The category to show the leaderboard for.')
            .addChoices(
                { name: 'XP', value: 'xp' },
                { name: 'Messages', value: 'messages' },
                { name: 'Voice Time', value: 'voice' },
                { name: 'Invites', value: 'invites' }
            )
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Number of users to display (1-20).')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false)
    );

const listUser = async (limit, sortField) => {
    const list = await MongoDb.aggregate(ENUMS.DCB.USERS, [
        { $sort: { [sortField]: Constants.MONGO.SORT.DESC } },
        { $limit: limit }
    ]);
    return list;
};

const sendMessage = async (interaction, member, lang, data, category) => {
    const columns = [{ label: lang.getText('username'), key: 'name' }];

    if (category === 'xp') {
        columns.push({ label: lang.getText('level'), key: 'lvl' });
        columns.push({ label: lang.getText('xp'), key: 'val' });
    } else {
        columns.push({ label: lang.getText(LEADERBOARD_TYPES[category].labelKey), key: 'val' });
    }

    const buildTable = new DiscordSimpleTable(columns)
        .setJsonArrayInputs(data)
        .setStringOffset(2)
        .addVerticalBar()
        .addIndex(1)
        .build();

    await new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ stringlist: buildTable })
        .addContext(lang, member, 'board')
        .interactionResponse(interaction);
};

const execute = async (dcInteraction) => {
    const { interaction, member, guild, lang } = dcInteraction;

    await DC.defer(interaction);

    await new Embed()
        .setColor(COLOR.IN_PROGRESS)
        .addContext(lang, member, 'loading')
        .interactionResponse(interaction);

    const category = interaction.options.getString('category') ?? 'xp';
    const limit = interaction.options.getInteger('limit') ?? config.commands.leaderboard.defaultListLimit;

    const sortField = LEADERBOARD_TYPES[category].field;
    const userList = await listUser(limit, sortField);

    let tableData = [];
    const mongoUser = new MongoUser();

    for (let i = 0; i < userList.length; i++) {
        const user = userList[i];
        let leadboardMember = await DC.memberById(user.id, guild);

        let username = leadboardMember
            ? (leadboardMember.nickname || leadboardMember.user.username)
            : `[${lang.getText('left-server')}]`;

        if (username.length > config.commands.leaderboard.maxNameLength) {
            username = username.substring(0, (config.commands.leaderboard.maxNameLength - 3)) + "...";
        }

        let displayValue = "";
        let level = 0;

        if (category === 'xp') {
            const rankData = await mongoUser._getLvlAndXpByRawXp(user.rawxp);
            level = rankData.level;
            displayValue = `[${humanizeNumber(rankData.xp)}|${humanizeNumber(rankData.neededXp)}]`;
        } else if (category === 'voice') {
            const totalMs = (user.stats?.voice?.time || 0) * Constants.TIME_MULTIPLIER_MS.SECONDS;
            const { d, h, m, s } = msToHumanReadableTime(totalMs);

            displayValue = `${d}${lang.getText('days')} ${h}${lang.getText('hours')} ${m}${lang.getText('minutes')} ${s}${lang.getText('seconds')}`;
        } else if (category === 'messages') {
            displayValue = humanizeNumber(user.stats?.messages?.count || 0);
        } else if (category === 'invites') {
            displayValue = humanizeNumber(user.stats?.invites?.real || 0);
        }

        tableData.push({
            name: username,
            lvl: humanizeNumber(level),
            val: displayValue
        });
    }

    await sendMessage(interaction, member, lang, tableData, category);
};

module.exports = { execute, data };