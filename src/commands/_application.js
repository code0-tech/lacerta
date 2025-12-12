const { ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { snowflakeToDate, msToHumanReadableTime } = require('./../utils/time');
const Constants = require('./../../data/constants');
const { Channel } = require('./../models/Channel');
const { keyArray } = require('./../utils/helper');
const { Embed, COLOR } = require('./../models/Embed');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const data = null;

const autoRun = async (client, lang) => {
    const messages = await DC.messagesFromChannel(client, config.serverid, config.channels.application);
    const messagesIds = keyArray(messages);

    messagesIds.forEach(async (messageId) => {
        const message = messages.get(messageId);
        if (message.author.id !== client.application.id) {
            await message.delete();
        }
    });

    if (messagesIds.length !== 0) return;

    const applyButtonClosedTeam = new ButtonBuilder()
        .setCustomId('application-apply-closed-team')
        .setLabel(lang.english['_application']['#btn-closed-team'])
        .setStyle(ButtonStyle.Primary);

    const applyButtonOpenContributor = new ButtonBuilder()
        .setCustomId('application-apply-open-contributor')
        .setLabel(lang.english['_application']['#btn-open-contributer'])
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
        .addComponents(applyButtonClosedTeam, applyButtonOpenContributor);

    new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ teamid: config.roles.team })
        .addContext({ text: lang.english['_application'] }, null, '#init-message')
        .setComponents([row])
        .responseToChannel(config.channels.application, client)
};

const checkLastCreatedTicket = async (guild, member) => {
    const channelsInCategory = await DC.channelsByParentId(config.parents.applications, guild);

    let hasChannel = channelsInCategory.some(channel => {
        const userOverWrite = channel.permissionOverwrites.cache.find(overwrite => overwrite.type === Constants.DISCORD.PERMS.USER_OVERRIDE && overwrite.id === member.id);
        return userOverWrite !== undefined && channel.id !== null;
    });

    return hasChannel;
};

const sendEmbedResponse = async (interaction, lang, member, color, contextKey) => {
    await new Embed()
        .setColor(color)
        .addContext(lang, member, contextKey)
        .interactionResponse(interaction);
};

const handleApplicationApply = async (interaction, client, guild, member, lang, buttonData) => {
    if (await checkLastCreatedTicket(guild, member)) {
        await sendEmbedResponse(interaction, lang, member, COLOR.DANGER, 'has-application');
        return;
    }

    const applicationChannel = await new Channel()
        .setName(`${Constants.DISCORD.EMOJIS.COMMAND_APPLY}${Constants.DISCORD.EMOJIS.COMBINELINE}${member.user.username}`)
        .setParent(config.parents.applications)
        .setType(ChannelType.GuildText)
        .setPermissionOverwrite(interaction.user.id, [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.AddReactions
        ])
        .setPermissionOverwrite(interaction.guild.id, [], [PermissionsBitField.Flags.ViewChannel])
        .createChannel(guild);

    const closeApplicationButton = new ButtonBuilder()
        .setCustomId('application-close')
        .setLabel(lang.getText('btn-close'))
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeApplicationButton);

    await new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, 'application-message')
        .setPin(true)
        .setComponents([row])
        .responseToChannel(applicationChannel.id, client);

    await new Embed()
        .setColor(COLOR.INFO)
        .addInputs({ channelid: applicationChannel.id })
        .addContext(lang, member, 'new-application')
        .interactionResponse(interaction);
};

const handleApplicationClose = async (interaction, client, guild, member, lang, isTeam) => {
    if (!isTeam) {
        await sendEmbedResponse(interaction, lang, member, COLOR.DANGER, 'no-team-member');
        return;
    }

    await interaction.message.delete();
    await sendEmbedResponse(interaction, lang, member, COLOR.DANGER, 'close-info');

    const applicationChannel = await DC.channelByInteraction(interaction, guild);

    const { removedIds } = await DC.removeChannelUserOverrides(applicationChannel);

    const confirmDeleteButton = new ButtonBuilder()
        .setCustomId('delete-ticket')
        .setLabel(lang.getText('btn-remove'))
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(confirmDeleteButton);

    const timeStamp = snowflakeToDate(interaction.channel.id);
    const { d, h, m, s } = msToHumanReadableTime(Date.now() - timeStamp);

    await new Embed()
        .setColor(COLOR.DANGER)
        .addInputs({
            closeduserid: interaction.user.id,
            ticketuserid: removedIds[0],
            days: d,
            hours: h,
            minutes: m,
            seconds: s
        })
        .addContext(lang, member, 'confirm-remove-application')
        .setComponents([row])
        .responseToChannel(applicationChannel.id, client);

    applicationChannel.setName(`${Constants.DISCORD.EMOJIS.KEY_LOCKED}${applicationChannel.name}-closed`);
};

const executeComponent = async (interaction, client, guild, member, lang, buttonData) => {
    await DC.defer(interaction);

    const isTeam = await DC.isTeamMember(member);

    if (buttonData.id === 'application-apply-closed-team' || buttonData.id === 'application-apply-open-contributor') {
        await handleApplicationApply(interaction, client, guild, member, lang, buttonData);
    } else if (buttonData.id === 'application-close') {
        await handleApplicationClose(interaction, client, guild, member, lang, isTeam);
    } else {
        if (!isTeam) {
            await sendEmbedResponse(interaction, lang, member, COLOR.DANGER, 'no-team-member');
            return;
        }

        const applicationChannel = await DC.channelByInteraction(interaction, guild);
        await applicationChannel.delete({ reason: "none" });
    }
};

const componentIds = [
    'application-apply-closed-team',
    'application-apply-open-contributor',
    'application-close',
    'application-remove'
];

module.exports = { executeComponent, componentIds, data, autoRun };