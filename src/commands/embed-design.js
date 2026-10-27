const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { LanguageHelper } = require("../interactions/language-helper");
const { Embed, COLOR } = require('./../models/Embed');
const DiscordSimpleTable = require('discord-simpletable');
const { humanizeNumber } = require('../utils/helper');
const { msToHumanReadableTime } = require('../utils/time');
const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const DC = require('./../singleton/DC');

const MongoDb = new Mongo();

const data = new SlashCommandBuilder()
  .setName('embed-design')
  .setDescription('Command for tests.')
  .setDescriptionLocalizations({
    de: 'Befehl zum testen.',
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


const execute = async (dcInteraction) => {
  const { interaction, client, member, guild } = dcInteraction;

  await DC.defer(interaction);

  const channelStatsRecords = await MongoDb.find(ENUMS.DCB.CHANNELS, {});

  let totalMessages = 0;
  let totalVoiceSeconds = 0;
  let textChannelsCount = 0;
  let voiceChannelsCount = 0;

  const textChannelRows = [];
  const voiceChannelRows = [];

  for (const record of channelStatsRecords) {
    const channelName = record.channelNames?.[record.channelNames.length - 1] || 'Unknown Channel';
    const trimmedName = channelName.length > 14 ? channelName.substring(0, 11) + '...' : channelName;

    if (record.type === Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.TEXT) {
      totalMessages += record.messageCount || 0;
      textChannelsCount++;

      textChannelRows.push({
        name: trimmedName,
        msgs: humanizeNumber(record.messageCount || 0)
      });
    } else if (record.type === Constants.MONGO.DEFINITIONS.CHANNEL_TYPES.VOICE) {
      totalVoiceSeconds += record.totalVoiceSeconds || 0;
      voiceChannelsCount++;

      const channelVoiceMs = (record.totalVoiceSeconds || 0) * Constants.TIME_MULTIPLIER_MS.SECONDS;
      const vd = msToHumanReadableTime(channelVoiceMs);

      voiceChannelRows.push({
        name: trimmedName,
        maxUsers: record.maxUserCount || 0,
        time: `${vd.h}h ${vd.m}m`
      });
    }
  }

  const totalVoiceMs = totalVoiceSeconds * Constants.TIME_MULTIPLIER_MS.SECONDS;
  const { d, h, m } = msToHumanReadableTime(totalVoiceMs);
  const voiceTimeString = `${d}d ${h}h ${m}m`;

  const sortedTextRows = textChannelRows
    .sort((a, b) => parseInt(b.msgs.replace(/,/g, '')) - parseInt(a.msgs.replace(/,/g, '')))
    .slice(0, 10);

  const textTableString = sortedTextRows.length > 0
    ? new DiscordSimpleTable([{ label: 'Text Channel', key: 'name' }, { label: 'Messages', key: 'msgs' }])
      .setJsonArrayInputs(sortedTextRows)
      .setStringOffset(2)
      .addVerticalBar()
      .addIndex(1)
      .build()
    : '`No text channel data recorded.`';

  const sortedVoiceRows = voiceChannelRows
    .sort((a, b) => b.maxUsers - a.maxUsers)
    .slice(0, 10);

  const voiceTableString = sortedVoiceRows.length > 0
    ? new DiscordSimpleTable([{ label: 'Voice Channel', key: 'name' }, { label: 'Peak', key: 'maxUsers' }, { label: 'Time', key: 'time' }])
      .setJsonArrayInputs(sortedVoiceRows)
      .setStringOffset(2)
      .addVerticalBar()
      .addIndex(1)
      .build()
    : '`No voice channel data recorded.`';

  const Lang = new LanguageHelper(client).createStandalonePack()
    .setPackCommandPath('year-review')
    .buildPack();

  const newYearEmbed = new Embed()
    .setTitle('TEST')
    .setDescription(`TEST`)
    .setColor(COLOR.INFO);

  const overviewEmbed = new Embed()
    .setTitle('📊 Server Activity Summary')
    .addFields([
      { name: 'Total Messages', value: humanizeNumber(totalMessages), inline: true },
      { name: 'Total Voice Time', value: voiceTimeString, inline: true },
      { name: 'Tracked Channels', value: `💬 ${textChannelsCount} Text | 🔊 ${voiceChannelsCount} Voice`, inline: false }
    ])
    .setColor(COLOR.INFO);

  const textChannelsEmbed = new Embed()
    .setTitle('💬 Top Text Channels')
    .setDescription(textTableString)
    .setColor(COLOR.INFO);

  const voiceChannelsEmbed = new Embed()
    .setTitle('🔊 Top Voice Channels')
    .setDescription(voiceTableString)
    .setColor(COLOR.INFO);

  await interaction.editReply({
    embeds: [
      newYearEmbed.getEmbed(),
      overviewEmbed.getEmbed(),
      textChannelsEmbed.getEmbed(),
      voiceChannelsEmbed.getEmbed()
    ],
    ephemeral: true
  });
};

const executeComponent = async (dcInteraction) => {
  const { interaction, client, guild, member, Lang, componentData } = dcInteraction;
  await DC.defer(interaction);
};

const componentIds = [];

module.exports = { execute, executeComponent, data };