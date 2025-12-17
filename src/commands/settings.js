const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, COLOR } = require('./../models/Embed');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your settings.')
    .setDescriptionLocalizations({
        de: 'Ändern deine Einstellungen.',
    })


const execute = async (interaction, client, guild, member, lang) => {
    await DC.defer(interaction);

};

module.exports = { execute, data };