const { ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, DiscordjsError, AttachmentBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const { waitMs, snowflakeToDate, msToHumanReadableTime } = require('./../utils/time');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Embed, progressBar } = require('./../models/Embed');
const { Card } = require('./../models/card/Card');
const config = require('./../../config.json');
const Chart = require('./../models/Chart');
const DC = require('./../singleton/DC');
const { Readable } = require('stream');
const { join } = require('path');

const { Mongo, ENUMS } = require('../models/Mongo');
const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
  .setName('embed-design')
  .setDescription('Command for tests.')
  .setDescriptionLocalizations({
    de: 'Befehl zum testen.',
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


const execute = async (dcInteraction) => {
  const { interaction, client, member, guild, lang } = dcInteraction;

  await DC.defer(interaction);

};

const executeComponent = async (dcInteraction) => {
  const { interaction, client, guild, member, lang, componentData } = dcInteraction;

  await DC.defer(interaction);


};

const componentIds = [];

module.exports = { execute, executeComponent, data };