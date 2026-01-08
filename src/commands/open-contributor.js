const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR, progressBar } = require('./../models/Embed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordSimpleTable = require('discord-simpletable');
const AsyncManager = require("../singleton/AsyncManager");
const { encryptString } = require('./../utils/crypto');
const Constants = require("../../data/constants");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('open-contributor')
    .setDescription('Use oAuth with Github to check if you can be an Open-Contributor.')
    .setDescriptionLocalizations({
        de: 'Verknüpfe deinen Github Account um nachzuschauen ob du bereits ein Open-Contributor bist.',
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

    if (await DC.memberHasRole(member, config.roles.opencontributor)) {
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
        .addInputs({ neededcommits: config.commands.opencontributor.commits, neededpr: config.commands.opencontributor.pr })
        .addContext(lang, member, 'initial-message')
        .setComponents([row])
        .interactionResponse(interaction);

    const resolvedAwait = await AsyncManager.awaitAsyncAction(awaitCodeId, config.commands.opencontributor.authTimeout, data.reference, true);

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

    if (github.totalCommitContributions >= config.commands.opencontributor.commits && github.totalPullRequests >= config.commands.opencontributor.pr) {
        messageType = 'results-complete';
        DC.memberAddRoleId(member, config.roles.opencontributor);
    } else {
        messageType = 'results-not-complete';
    }

    await new Embed()
        .setColor(COLOR.INFO)
        .addInputs({
            tablestring: table.build(),
            yourpr: github.totalPullRequests,
            neededpr: config.commands.opencontributor.pr,

            pbpr: progressBar(github.totalPullRequests, config.commands.opencontributor.pr),
            pbcm: progressBar(github.totalCommitContributions, config.commands.opencontributor.commits),

            yourcommits: github.totalCommitContributions,
            neededcommits: config.commands.opencontributor.commits,

            githubname: name
        })
        .addContext(lang, member, messageType)
        .setComponents([])
        .interactionResponse(interaction);
};

module.exports = { execute, data };