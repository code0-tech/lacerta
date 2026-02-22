const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR, progressBar } = require('./../models/Embed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordSimpleTable = require('discord-simpletable');
const AsyncManager = require("../singleton/AsyncManager");
const { encryptString } = require('./../utils/crypto');
const Constants = require("../../data/constants");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const dcServerRoles = config.server.roles;
const dcCommands = config.commands;

const data = new SlashCommandBuilder()
    .setName('open-contributor')
    .setDescription('Temporary link your Github account to check if you can be an Open-Contributor.')
    .setDescriptionLocalizations({
        de: 'Verknüpfe temporär deinen Github Account um nachzuschauen ob du bereits ein Open-Contributor bist.',
    })


const failedMessage = async (interaction, client, member, lang, type) => {
    await new Embed()
        .setColor(COLOR.DANGER)
        .addContext(lang, member, type)
        .interactionResponse(interaction);
};

const createButtonRow = (data, lang) => {
    const userIdEncrypted = encryptString(JSON.stringify(data));
    const oAuthLink = Constants.GIT.URL.OAUTH_LINK(userIdEncrypted, Constants.GIT.GITHUB_SCOPES);

    const oAuthLinkButton = new ButtonBuilder()
        .setLabel(lang.getText('button-link'))
        .setURL(oAuthLink)
        .setStyle(ButtonStyle.Link);

    return new ActionRowBuilder().addComponents(oAuthLinkButton);
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, lang } = dcInteraction;

    await DC.defer(interaction);

    if (await DC.memberHasRole(member, dcServerRoles.opencontributor)) {
        failedMessage(interaction, client, member, lang, 'error-already-has-role');
        return;
    }

    const awaitCodeId = AsyncManager.generateId();
    const data = {
        userId: interaction.user.id,
        awaitCodeId,
        reference: `${interaction.user.id}-open-contributor`
    };

    const row = createButtonRow(data, lang);

    await new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ neededcommits: dcCommands.opencontributor.commits, neededpr: dcCommands.opencontributor.pr })
        .addContext(lang, member, 'initial-message')
        .setComponents([row])
        .interactionResponse(interaction);

    const resolvedAwait = await AsyncManager.awaitAsyncAction(awaitCodeId, dcCommands.opencontributor.authTimeout, data.reference, true);

    if (!resolvedAwait) {
        failedMessage(interaction, client, member, lang, resolvedAwait === false ? 'error-timeout' : 'error-similar-inquiry');
        return;
    }

    const { name, github } = resolvedAwait;

    let table = null;
    let messageType = '';

    if (github.contributions.length === 0) {
        messageType = 'results-no-data';
    } else {
        const columns = [
            { label: lang.getText('repo'), key: 'repository' },
            { label: lang.getText('commits'), key: 'commitCount' },
            { label: lang.getText('prs'), key: 'pullRequestCount' }
        ];

        table = new DiscordSimpleTable(columns)
            .setJsonArrayInputs(github.contributions)
            .setStringOffset(2)
            .addVerticalBar()
            .addIndex(1)
    }

    if (github.totalCommitContributions >= dcCommands.opencontributor.commits && github.totalPullRequests >= dcCommands.opencontributor.pr) {
        messageType = 'results-complete';
        DC.memberAddRoleId(member, dcServerRoles.opencontributor);
    } else {
        messageType = 'results-not-complete';
    }

    await new Embed()
        .setColor(COLOR.INFO)
        .addInputs({
            tablestring: table.build(),
            yourpr: github.totalPullRequests,
            neededpr: dcCommands.opencontributor.pr,

            pbpr: progressBar(github.totalPullRequests, dcCommands.opencontributor.pr),
            pbcm: progressBar(github.totalCommitContributions, dcCommands.opencontributor.commits),

            yourcommits: github.totalCommitContributions,
            neededcommits: dcCommands.opencontributor.commits,

            githubname: name
        })
        .addContext(lang, member, messageType)
        .setComponents([])
        .interactionResponse(interaction);
};

module.exports = { execute, data };