const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { convertUnixToTimestamp } = require('../utils/time');
const DiscordSimpleTable = require('discord-simpletable');
const { Embed, COLOR } = require('./../models/Embed');
const { Mongo, ENUMS } = require('../models/Mongo');
const DcButtons = require("../singleton/DcButtons");
const Constants = require("../../data/constants");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
    .setName('logs')
    .setDescription('CodeZero Bot logs.')
    .setDescriptionLocalizations({
        de: 'CodeZero Bot logs.',
    })
    .addSubcommand(subcommand => subcommand
        .setName('show')
        .setDescription('Show current session.')
        .setDescriptionLocalizations({
            de: 'Zeige die aktuelle Session.',
        })
    )
    .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('Get a list of Logs.')
        .setDescriptionLocalizations({
            de: 'Zeigt eine Liste der Logs.',
        })
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);


const getLogs = async (runId) => {
    const results = await MongoDb.find(ENUMS.DCB.LOGS, { run_id: runId });
    return results[0];
};

const getCurrentSessionRunId = () => process['dclogger'].runid;

const formatLog = (log) => {
    const timestamp = convertUnixToTimestamp(log.time);
    return `${timestamp}\n\`\`\`${log.msg}\`\`\`${log.error ? `\n\`\`\`Error:\n${log.error}\`\`\`` : ''}\n`;
};

const printSessionToTxt = async (interaction, member, Lang, componentData) => {
    const runId = componentData.s;

    const totalLog = await getLogs(runId);

    const formattedLogs = totalLog.logs.map(log => {
        const readableTime = new Date(log.time).toLocaleString();
        const message = log.error ? log.error : log.msg;
        return `[${readableTime}]: ${message}`;
    }).join('\n');

    const buffer = Buffer.from(formattedLogs, Constants.SETTINGS.ENCODING.UTF8);
    const attachment = new AttachmentBuilder(buffer, { name: `logfile-${runId}.txt` });

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed('print-out'))
        .setAttachment(attachment)
        .interactionResponse(interaction);
};

const getLogsWithRange = async (runId, action, currentStart, currentEnd) => {
    const logFile = await getLogs(runId);
    if (!logFile) return {};

    const createdAt = convertUnixToTimestamp(logFile.created_at);
    const maxList = config.commands.logs.maxList;
    const totalLength = logFile.logs.length;

    let rangeStart = 0;
    let rangeEnd = totalLength > maxList ? maxList : totalLength;

    if (action === 'next') {
        rangeStart = currentEnd;
        rangeEnd = Math.min(rangeStart + maxList, totalLength);
    } else if (action === 'back') {
        rangeStart = Math.max(currentStart - maxList, 0);
        rangeEnd = Math.min(rangeStart + maxList, totalLength);
    } else if (action === 'last') {
        rangeStart = Math.max(totalLength - maxList, 0);
        rangeEnd = totalLength;
    }

    const logsInRange = logFile.logs.slice(rangeStart, rangeEnd);
    const logString = logsInRange.map(formatLog).join('');

    return { createdAt, logString, totalLength, rangeStart, rangeEnd };
};

const sendLog = async (interaction, member, Lang, componentData, runId = null, type) => {
    const sessionId = runId || componentData.s;
    const action = componentData?.action || 'init';
    const currentStart = componentData?.currentstart || 0;
    const currentEnd = componentData?.currentendposition || config.commands.logs.maxList;

    if (parseInt(sessionId) == getCurrentSessionRunId()) {
        type = 'show';
    }

    const { createdAt, logString, totalLength, rangeStart, rangeEnd } = await getLogsWithRange(parseInt(sessionId), action, currentStart, currentEnd);
    if (!createdAt) {
        return new Embed()
            .setColor(COLOR.DANGER)
            .addLangContext(Lang.embed('not-found', { runid: sessionId }))
            .interactionResponse(interaction);
    }

    const commonData = {
        currentstart: rangeStart,
        currentendposition: rangeEnd,
        s: sessionId
    };

    const buttons = [
        new ButtonBuilder()
            .setCustomId(DcButtons.createString('logs', { type, action: 'back', ...commonData }))
            .setLabel(Lang.string('texts.btn-back'))
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(DcButtons.createString('logs', { type, action: 'next', ...commonData }))
            .setLabel(Lang.string('texts.btn-next'))
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(DcButtons.createString('logs', { type, action: 'last', ...commonData }))
            .setLabel(Lang.string('texts.btn-skip'))
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId(DcButtons.createString('logs', { type: 'print', action: 'print', ...commonData }))
            .setLabel(Lang.string('texts.btn-print'))
            .setStyle(ButtonStyle.Success),
    ];

    const row = new ActionRowBuilder().addComponents(buttons);

    new Embed()
        .setColor(type === 'show' ? COLOR.INFO : COLOR.IN_PROGRESS)
        .addLangContext(Lang.embed(type === 'show' ? 'session-logs' : 'old-session-logs', {
            runid: sessionId,
            createdat: createdAt,
            logstring: logString,
            totallogscount: totalLength,
            currentstart: rangeStart,
            currentend: rangeEnd
        }))
        .setComponents([row])
        .interactionResponse(interaction);
};

const showCurrentSessionLogs = async (interaction, member, Lang, componentData) => {
    if (global.isDevelopment) {
        return new Embed()
            .setColor(COLOR.DANGER)
            .addLangContext(Lang.embed('development'))
            .interactionResponse(interaction);
    }
    sendLog(interaction, member, Lang, componentData, getCurrentSessionRunId(), 'show');
};

const viewDbLogs = (interaction, member, Lang, componentData) => {
    const runId = componentData.selected || null;
    sendLog(interaction, member, Lang, componentData, runId, 'view');
};

const listDbLogs = async (interaction, member, Lang, componentData) => {
    const results = await MongoDb.aggregate(ENUMS.DCB.LOGS, [
        { $project: { _id: 0, run_id: 1, logs_length: { $size: "$logs" }, created_at: 1 } },
        { $sort: { created_at: Constants.MONGO.SORT.DESC } },
        { $limit: 20 }
    ]);

    const data = results.map(doc => ({
        run_id: doc.run_id,
        created_at: convertUnixToTimestamp(doc.created_at),
        logs_length: doc.logs_length
    }));

    const selectMenuOptions = data.map((doc, index) => ({
        label: `${index + 1}, RunId: ${doc.run_id}`,
        description: `${doc.created_at}, ${doc.logs_length}`,
        value: doc.run_id.toString()
    }));

    const columns = [
        { label: Lang.string('texts.run-id'), key: 'run_id' },
        { label: Lang.string('texts.text-createdat'), key: 'created_at' },
        { label: Lang.string('texts.text-size'), key: 'logs_length' }
    ];

    const buildTable = new DiscordSimpleTable(columns)
        .setJsonArrayInputs(data)
        .setStringOffset(2)
        .addVerticalBar()
        .addIndex(1)
        .build();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(DcButtons.createString('logs', { type: 'view' }))
        .setPlaceholder(Lang.string('texts.select-menu-placholder'))
        .addOptions(selectMenuOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed('list-logs', { list: buildTable }))
        .setComponents([row])
        .interactionResponse(interaction);
};

const subCommandHandlers = {
    show: showCurrentSessionLogs,
    view: viewDbLogs,
    list: listDbLogs,
    print: printSessionToTxt
};

const findAndExecuteSubCommand = (subCommand, ...args) => {
    if (subCommandHandlers[subCommand]) {
        subCommandHandlers[subCommand](...args);
    }
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, Lang } = dcInteraction;

    await DC.defer(interaction);

    const results = await MongoDb.aggregate(ENUMS.DCB.LOGS, [
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ]);

    const totalCount = results.length > 0 ? results[0].count : 0;

    if (totalCount == 0) {
        new Embed()
            .setColor(COLOR.INFO)
            .addLangContext(Lang.embed('list-logs-empty'))
            .interactionResponse(interaction);
        return;
    }

    const subCommand = interaction.options.getSubcommand();
    const componentData = null;
    findAndExecuteSubCommand(subCommand, interaction, member, Lang, componentData);
};

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, Lang, componentData } = dcInteraction;

    await DC.defer(interaction);
    findAndExecuteSubCommand(componentData.type, interaction, member, Lang, componentData);
};

const componentIds = ['logs'];

module.exports = { execute, data, componentIds, executeComponent };