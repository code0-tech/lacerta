const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, COLOR } = require('./../models/Embed');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('links')
    .setDescription('Get a list of CodeZero links.')
    .setDescriptionLocalizations({
        de: 'Liste wichtiger CodeZero links.',
    })


const execute = async (interaction, client, guild, member, lang) => {
    await DC.defer(interaction);

    new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, 'list')
        .interactionResponse(interaction);
};

module.exports = { execute, data };