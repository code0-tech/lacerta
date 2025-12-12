const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { msToHumanReadableTime, convertUnixToTimestamp, waitMs } = require('./../utils/time');
const { sendGitRankMessage } = require('../dc-guild/git-rank');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, progressBar, COLOR } = require('./../models/Embed');
const { PermissionFlagsBits } = require("discord.js");
const { Mongo, ENUMS } = require('../models/Mongo');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Code0 Debug commands.')
    .setDescriptionLocalizations({
        de: 'Code0 Debug Befehle.',
    })
    .addStringOption(option =>
        option.setName('action')
            .setDescription('Select a Debug command.')
            .setDescriptionLocalizations({
                de: 'Wähl ein Debug Befehl aus.',
            })
            .setRequired(true)
            .addChoices(
                { name: '[Client] => This session time', value: 'clientSessionTime' },
                { name: '[MongoDB] => Check left users', value: 'mongoLeftUsers' },
                { name: '[MongoDB] => githubcommits -> new Chart', value: 'chartFromGithubTotalCommits' },
                { name: '[DC.Server] => ping all discord server configs', value: 'pingAllDiscordServerConfigs' }
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


const debugs = {
    async mongoLeftUsers(interaction, client, guild, member, lang) {
        const updateSearchingEmbed = (totaluser = 0, checked = 0, found = 0) => {
            new Embed()
                .setColor(COLOR.INFO)
                .addInputs({ totaluser, checked, found })
                .addContext(lang, member, 'mongo-left-users-loading')
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
            description: `${lang.getText('remove')} ${userId}`,
            value: `${userId}`
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('debug*type=removefromdb')
            .setPlaceholder(lang.getText('left-user-remove'))
            .addOptions(selectMenuOptions);

        const rowWithSelectMenu = new ActionRowBuilder().addComponents(selectMenu);

        const button = new ButtonBuilder()
            .setCustomId(`debug*type=mongoLeftUsers`)
            .setLabel(lang.getText('left-user-reload'))
            .setStyle(ButtonStyle.Primary);

        const rowWithReloadButton = new ActionRowBuilder().addComponents(button);

        new Embed()
            .setColor(COLOR.INFO)
            .addInputs({
                userstring: (usersLeft.length == 0 ? `${lang.getText("found-none")}` : usersLeft.join("\n")),
                progressbar: progressBar(usersLeft.length, userIds.length) + ` [${usersLeft.length}|${userIds.length}]`
            })
            .addContext(lang, member, 'mongo-left-users')
            .setComponents((usersLeft.length !== 0 ? [rowWithSelectMenu] : [rowWithReloadButton]))
            .interactionResponse(interaction);
    },

    async clientSessionTime(interaction, client, guild, member, lang) {
        const { d, h, m, s } = msToHumanReadableTime(Date.now() - client.startDate);

        const embed = new Embed()
            .setColor(COLOR.INFO)
            .addInputs({
                upsince: convertUnixToTimestamp(client.startDate),
                days: d,
                hours: h,
                minutes: m,
                seconds: s
            })
            .addContext(lang, member, 'client-session-time');

        const response = await embed.interactionResponse(interaction);
        if (response == null) return;

        await waitMs(5000);

        this.clientSessionTime(interaction, client, guild, member, lang);
    },

    async chartFromGithubTotalCommits(interaction, client, guild, member, lang) {
        const embed = await sendGitRankMessage(null);
        embed.interactionResponse(interaction);
    },

    async pingAllDiscordServerConfigs(interaction, client, guild, member, lang) {
        let description = `${lang.getText('channels')}\n\n`;

        for (const key in config.channels) {
            description += `${DC.mentionChannel(config.channels[key])}\n`;
        }

        description += `\n${lang.getText('roles')}\n\n`;

        for (const key in config.roles) {
            description += `${DC.mentionRole(config.roles[key])}\n`;
        }

        description += `\n${lang.getText('langroles')}\n\n`;

        for (const key in config.languageroles) {
            description += `${DC.mentionRole(key)}`;
        }

        new Embed()
            .setColor(COLOR.INFO)
            .setDescription(description)
            .interactionResponse(interaction)
    }
}

const removeFromDB = async (interaction, client, guild, member, lang, componentData) => {
    const userId = componentData.selected;

    await MongoDb.deleteOne(ENUMS.DCB.USERS, { id: userId });

    const button = new ButtonBuilder()
        .setCustomId(`debug*type=mongoLeftUsers`)
        .setLabel(lang.getText('left-user-reload'))
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ userid: userId })
        .addContext(lang, member, 'mongo-removed-user')
        .setComponents([row])
        .interactionResponse(interaction);
}

const execute = async (interaction, client, guild, member, lang) => {
    await DC.defer(interaction);

    const type = interaction.options.getString('action');

    debugs[type](interaction, client, guild, member, lang);
}

const executeComponent = async (interaction, client, guild, member, lang, componentData) => {
    await DC.defer(interaction);

    if (componentData.type == 'removefromdb') {
        removeFromDB(interaction, client, guild, member, lang, componentData);
        return
    }

    if (debugs[componentData.type]) {
        debugs[componentData.type](interaction, client, guild, member, lang, componentData);
    }
}

const componentIds = [
    'debug'
];


module.exports = { execute, executeComponent, componentIds, data };