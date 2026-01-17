const { msToHumanReadableTime, waitMs } = require('./../utils/time');
const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordSimpleTable = require('discord-simpletable');
const { MongoUser } = require('./../mongo/MongoUser');
const { humanizeNumber } = require('../utils/helper');
const { Embed, COLOR } = require('./../models/Embed');
const Constants = require('../../data/constants');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Check your stats.')
    .setDescriptionLocalizations({
        de: 'Zeigt deine eigenen Statistiken.',
    })
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('View stats for another member.')
            .setDescriptionLocalizations({
                de: 'Zeigt die Statistiken eines anderen Benutzers.',
            })
            .setRequired(false)
    );


const normalizeData = (data) => {
    data.messages = data.messages || { words: 0, chars: 0, count: 0 };
    data.messages.words = data.messages.words || 0;
    data.messages.chars = data.messages.chars || 0;
    data.messages.count = data.messages.count || 0;

    data.voice = data.voice || { joins: 0, switchs: 0, time: 0 };
    data.voice.joins = data.voice.joins || 0;
    data.voice.switchs = data.voice.switchs || 0;
    data.voice.time = data.voice.time || 0;

    return data;
};

const buildCommandStatsString = (commandstats, lang) => {
    if (Object.keys(commandstats).length == 0) return lang.getText('no-command-executed');

    const columns = [
        { label: lang.getText('command'), key: 'command' },
        { label: lang.getText('executed'), key: 'executed' },
        { label: lang.getText('button'), key: 'button' },
        { label: lang.getText('autocomplete'), key: 'autocomplete' },
        { label: lang.getText('selectmenu'), key: 'selectmenu' }
    ];

    const data = Object.entries(commandstats).map(([key, value]) => {
        return {
            command: key,
            executed: value.command || 0,
            button: value.button || 0,
            autocomplete: value.autocomplete || 0,
            selectmenu: value.selectmenu || 0
        };
    });

    const sortedData = data.sort((a, b) => b.executed - a.executed);

    const buildTable = new DiscordSimpleTable(columns)
        .setJsonArrayInputs(sortedData)
        .setStringOffset(2)
        .addVerticalBar()
        .addIndex(1)
        .build();

    return buildTable;
};

const loop = async (client, interaction, member, lang, embedMessage, rankMember, user, previousStats = null) => {
    const stats = await user.getStats();
    const commandstats = await user.getCommandUsage();
    const inviteStats = await user.getInviteStats();

    const commandStatsString = buildCommandStatsString(commandstats, lang);
    const normalizedStats = normalizeData(stats);

    const statsChanged = !previousStats || JSON.stringify(normalizedStats) !== JSON.stringify(previousStats);

    if (statsChanged) {

        const activeVoiceTime = normalizedStats.voice.activeTime * Constants.TIME_MULTIPLIER_MS.SECONDS;
        const inactiveVoiceTime = (normalizedStats.voice._totalCalculated - normalizedStats.voice.activeTime) * Constants.TIME_MULTIPLIER_MS.SECONDS;

        const { s: voiceSecondsActive,
            m: voiceMinutesActive,
            h: voiceHoursActive,
            d: voiceDaysActive
        } = msToHumanReadableTime(activeVoiceTime);

        const { s: voiceSecondsInactive,
            m: voiceMinutesInactive,
            h: voiceHoursInactive,
            d: voiceDaysInactive
        } = msToHumanReadableTime(inactiveVoiceTime);

        const userChannel = await DC.memberVoiceChannel(rankMember);

        const embed = new Embed()
            .setColor(COLOR.INFO)
            .setPbThumbnail(rankMember)
            .addInputs({
                channelmention: (userChannel == null ? Constants.SYMBOLS.UNKOWN_01 : `${DC.mentionChannel(userChannel.id)}`),
                count: humanizeNumber(normalizedStats.messages.count),
                words: humanizeNumber(normalizedStats.messages.words),
                chars: humanizeNumber(normalizedStats.messages.chars),
                joins: humanizeNumber(normalizedStats.voice.joinCount),
                switchs: humanizeNumber(normalizedStats.voice.channelSwitches),
                voiceDaysActive,
                voiceHoursActive,
                voiceMinutesActive,
                voiceSecondsActive,
                voiceDaysInactive,
                voiceHoursInactive,
                voiceMinutesInactive,
                voiceSecondsInactive,
                commandstatsstring: commandStatsString,
                invitesreal: inviteStats.real,
                invitestotal: inviteStats.total
            })
            .addContext(lang, member, embedMessage);

        const response = await embed.interactionResponse(interaction);
        if (response == null) return;
    }

    if (embedMessage !== 'this-bot-stats' && config.commands.stats.upToDate15m) {
        await waitMs(config.commands.stats.updateMessageDelay);
        loop(client, interaction, member, lang, embedMessage, rankMember, user, normalizedStats);
    }
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, lang } = dcInteraction;

    await DC.defer(interaction);

    const userIdToCheck = interaction.options.getMember('user')?.user?.id ?? member.user.id;
    let embedMessage = userIdToCheck == member.user.id ? 'own-stats-response' : 'other-stats-response';

    if (client.user.id === userIdToCheck) {
        embedMessage = 'this-bot-stats';
    }

    const rankMember = await DC.memberById(userIdToCheck, guild);
    const user = await new MongoUser().userById(userIdToCheck)

    loop(client, interaction, member, lang, embedMessage, rankMember, user);
};

module.exports = { execute, data };