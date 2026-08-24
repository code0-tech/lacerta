const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, COLOR } = require('./../models/Embed');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('contributor')
    .setDescription('Explore our Open-Contributor guidelines.')
    .setDescriptionLocalizations({
        de: 'Open-Contributor Guidelines.',
    })


const execute = async (dcInteraction) => {
    const { interaction, member, Lang } = dcInteraction;

    await DC.defer(interaction);

    const opencontributorInfo = config.commands.opencontributor;

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed("infoMessage", {
            neededPullRequests: opencontributorInfo.pr,
            neededCommits: opencontributorInfo.commits
        }))
        .interactionResponse(interaction);
};

module.exports = { execute, data };