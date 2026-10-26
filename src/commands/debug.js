const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { msToHumanReadableTime, convertUnixToTimestamp, waitMs } = require('./../utils/time');
const { Embed, progressBar, COLOR } = require('./../models/Embed');
const { sendGitRankMessage } = require('../dc-guild/git-rank');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require("discord.js");
const { Mongo, ENUMS } = require('../models/Mongo');
const DcButtons = require("../singleton/DcButtons");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
    .setName('debug')
    .setDescription('CodeZero Debug commands.')
    .setDescriptionLocalizations({
        de: 'CodeZero Debug Befehle.',
    })
    .addStringOption(option =>
        option.setName('action')
            .setDescription('Select a command.')
            .setDescriptionLocalizations({
                de: 'Wähl ein Befehl aus.',
            })
            .setRequired(true)
            .addChoices(
                { name: '[Client] => Display current session time', value: 'clientSessionTime' },
                { name: '[MongoDB] => Compare MongoDb users with Discord Members', value: 'mongoLeftUsers' },
                { name: '[MongoDB] => Create todays githubcommits Chart', value: 'chartFromGithubTotalCommits' },
                { name: '[DC.Server] => Show Bots roles/channels config', value: 'pingAllDiscordServerConfigs' }
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


const debugs = {
    async mongoLeftUsers(interaction, client, guild, member, Lang) {
        const updateSearchingEmbed = (totaluser = 0, checked = 0, found = 0) => {
            new Embed()
                .setColor(COLOR.INFO)
                .addLangContext(Lang.embed('mongo-left-users-loading', { totaluser, checked, found }))
                .interactionResponse(interaction);
        }

        updateSearchingEmbed();

        const pipeline = [
            {
                $project: {
                    id: 1,
                    _id: 1
                }
            }
        ]

        const userIds = await MongoDb.aggregate(ENUMS.DCB.USERS, pipeline);

        let checked = 0;
        let found = 0;

        updateSearchingEmbed(userIds.length, checked, found);

        const interval = setInterval(() => updateSearchingEmbed(userIds.length, checked, found), 2000);

        let usersLeft = [];

        for (let i = 0; i < userIds.length; i++) {
            const userPacket = userIds[i];
            const result = await DC.memberById(userPacket.id, guild);
            if (!result) {
                usersLeft.push(userPacket.id);
                found++;
            }
            checked++;
        }

        clearInterval(interval);

        const selectMenuOptions = usersLeft.map((userId, index) => ({
            label: `${userId}`,
            description: `${Lang.string('texts.remove')} ${userId}`,
            value: `${userId}`
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(DcButtons.createString('debug', { type: 'removefromDB' }))
            .setPlaceholder(Lang.string('texts.left-user-remove'))
            .addOptions(selectMenuOptions);

        const rowWithSelectMenu = new ActionRowBuilder().addComponents(selectMenu);

        const button = new ButtonBuilder()
            .setCustomId(DcButtons.createString('debug', { type: 'mongoLeftUsers' }))
            .setLabel(Lang.string('texts.left-user-reload'))
            .setStyle(ButtonStyle.Primary);

        const rowWithReloadButton = new ActionRowBuilder().addComponents(button);

        new Embed()
            .setColor(COLOR.INFO)
            .addLangContext(Lang.embed('mongo-left-users', {
                userstring: (usersLeft.length == 0 ? `${Lang.string('texts.found-none')}` : usersLeft.join("\n")),
                progressbar: progressBar(usersLeft.length, userIds.length) + ` [${usersLeft.length}|${userIds.length}]`
            }))
            .setComponents((usersLeft.length !== 0 ? [rowWithSelectMenu] : [rowWithReloadButton]))
            .interactionResponse(interaction);
    },

    async clientSessionTime(interaction, client, guild, member, Lang) {
        const { d, h, m, s } = msToHumanReadableTime(Date.now() - client.startDate);

        const embed = new Embed()
            .setColor(COLOR.INFO)
            .addLangContext(Lang.embed('client-session-time', {
                upsince: convertUnixToTimestamp(client.startDate),
                days: d,
                hours: h,
                minutes: m,
                seconds: s
            }));

        const response = await embed.interactionResponse(interaction);
        if (response == null) return;

        await waitMs(5000);

        this.clientSessionTime(interaction, client, guild, member, Lang);
    },

    async chartFromGithubTotalCommits(interaction, client, guild, member, Lang) {
        const embed = await sendGitRankMessage(null);
        embed.interactionResponse(interaction);
    },

    async pingAllDiscordServerConfigs(interaction, client, guild, member, Lang) {
        let description = `${Lang.string('texts.channels')}\n\n`;

        for (const key in config.server.channels) {
            description += `${key} | ${DC.mentionChannel(config.server.channels[key])}\n`;
        }

        description += `\n${Lang.string('texts.roles')}\n\n`;

        for (const key in config.server.roles) {
            description += `${key} | ${DC.mentionRole(config.server.roles[key])}\n`;
        }

        description += `\n${Lang.string('texts.langroles')}\n\n`;

        for (const key in config.server.languageRoles) {
            description += `${key} | ${DC.mentionRole(key)}\n`;
        }

        new Embed()
            .setColor(COLOR.INFO)
            .setDescription(description)
            .interactionResponse(interaction);
    }
};

const removeFromDB = async (interaction, client, guild, member, Lang, componentData) => {
    const userId = componentData.selected;

    await MongoDb.deleteOne(ENUMS.DCB.USERS, { id: userId });

    const button = new ButtonBuilder()
        .setCustomId(DcButtons.createString('debug', { type: 'mongoLeftUsers' }))
        .setLabel(Lang.string('texts.left-user-reload'))
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed('mongo-removed-user', { removedId: userId }))
        .setComponents([row])
        .interactionResponse(interaction);
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, Lang } = dcInteraction;

    await DC.defer(interaction);

    const type = interaction.options.getString('action');

    debugs[type](interaction, client, guild, member, Lang);
};

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, Lang, componentData } = dcInteraction;

    await DC.defer(interaction);

    if (componentData.type == 'removefromDB') {
        removeFromDB(interaction, client, guild, member, Lang, componentData);
        return;
    }

    if (debugs[componentData.type]) {
        debugs[componentData.type](interaction, client, guild, member, Lang, componentData);
    }
};

const componentIds = [
    'debug'
];

module.exports = { execute, executeComponent, componentIds, data };