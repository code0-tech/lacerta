const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, COLOR } = require('./../models/Embed');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('links')
    .setDescription('Get a list of CodeZero links.')
    .setDescriptionLocalizations({
        de: 'Liste der CodeZero links.',
    })


const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, lang } = dcInteraction;

    await DC.defer(interaction);

    new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, 'list')
        .interactionResponse(interaction);
};

module.exports = { execute, data };