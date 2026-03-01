const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, COLOR } = require('./../models/Embed');
const { PermissionFlagsBits } = require("discord.js");
const DC = require('./../singleton/DC');

const data = new SlashCommandBuilder()
    .setName('git-issue-created')
    .setDescription('Create a info message with a Github Link to the issues that was created.')
    .setDescriptionLocalizations({
        de: 'Send eine Info Nachricht mit dem Link zum Github issues welches erstellt wurde.',
    })
    .addStringOption(option =>
        option.setName('link')
            .setDescription('Github Link')
            .setDescriptionLocalizations({
                de: 'Der Github Link',
            })
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


const execute = async (dcInteraction) => {
    const { interaction, member, lang } = dcInteraction;

    await DC.defer(interaction);

    const link = interaction.options.getString('link');

    new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ link: link })
        .addContext(lang, member, 'info-embed')
        .responseToChannelByInteraction(interaction)

    new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, 'user-info-embed')
        .interactionResponse(interaction)
};

module.exports = { execute, data };