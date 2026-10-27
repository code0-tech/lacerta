const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { LanguageHelper } = require("../interactions/language-helper");
const { Embed, COLOR } = require('../models/Embed');
const TempEntryDB = require("../mongo/TempEntryDB");
const { keyArray } = require('../utils/helper');
const { Thread } = require("../models/Thread");
const config = require('../../config.json');
const DC = require('../singleton/DC');

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, componentData } = dcInteraction;

    await DC.defer(interaction);

    const Lang = new LanguageHelper(client).createStandalonePack()
        .setPackCommandPath('event-prereminder')
        .buildPack()

    const tempEntry = await new TempEntryDB()
        .setIdentifiers('eventPreReminderInviteButtons')
        .restoreFromFilterByArray('messages', interaction.message.id);

    const data = tempEntry.getData();

    if (!data.messages) {
        await interaction.editReply({ content: Lang.string('texts.event-no-longer-valid'), ephemeral: true });
        return;
    }

    const userId = member.id;
    data.acceptedInvite = (data.acceptedInvite || []).filter(id => id !== userId);
    data.acceptedInviteButComeLater = (data.acceptedInviteButComeLater || []).filter(id => id !== userId);
    data.unAcceptedInvite = (data.unAcceptedInvite || []).filter(id => id !== userId);

    let replyContent = "";

    if (componentData.acceptInvite == "0") {
        data.acceptedInvite.push(userId);
        replyContent = Lang.string('texts.invite-accepted');
    } else if (componentData.acceptInvite == "1") {
        data.acceptedInviteButComeLater.push(userId);
        replyContent = Lang.string('texts.invite-comes-later');
    } else if (componentData.acceptInvite == "2") {
        data.unAcceptedInvite.push(userId);
        replyContent = Lang.string('texts.invite-declined');
    } else {

    }

    const channel = interaction.channel;

    tempEntry.setData(data);
    await tempEntry.save();

    const acceptedMentions = data.acceptedInvite.length > 0
        ? data.acceptedInvite.map(id => `<@${id}>`).join(', ')
        : Lang.string('texts.none');

    const acceptedMentionsButComeLater = data.acceptedInviteButComeLater.length > 0
        ? data.acceptedInviteButComeLater.map(id => `<@${id}>`).join(', ')
        : Lang.string('texts.none');

    const declinedMentions = data.unAcceptedInvite.length > 0
        ? data.unAcceptedInvite.map(id => `<@${id}>`).join(', ')
        : Lang.string('texts.none');

    const attendanceText = [
        `${data.messageContents[interaction.message.id].description}`,
        ``,
        `**${Lang.string('texts.total-participants')}:** ${data.acceptedInvite.length + data.unAcceptedInvite.length + data.acceptedInviteButComeLater.length}`,
        `✅ **${Lang.string('texts.accepted')} (${data.acceptedInvite.length}):**`,
        acceptedMentions,
        '',
        `⏱️ **${Lang.string('texts.accepted-but-come-later')} (${data.acceptedInviteButComeLater.length}):**`,
        acceptedMentionsButComeLater,
        '',
        `❌ **${Lang.string('texts.declined')} (${data.unAcceptedInvite.length}):**`,
        declinedMentions
    ].join('\n');

    const listEmbed = new Embed()
        .setTitle(data.messageContents[interaction.message.id].title)
        .setDescription(attendanceText)
        .setColor(COLOR.INFO);

    for (const msgId of data.messages) {
        try {
            const targetMsg = await channel.messages.fetch(msgId);
            // const originalEmbedData = targetMsg.embeds[0]?.data || targetMsg.embeds[0];

            await targetMsg.edit({
                embeds: [listEmbed._embed.data],
                components: targetMsg.components
            });
        } catch (err) {
            console.error(`[Event PreReminder Attendance Status] Update failed for ${msgId}:`, err.message);
        }
    }

    await interaction.editReply({
        content: replyContent,
        ephemeral: true
    });
};

const componentIds = [
    'eventPreReminderInviteButton'
];

module.exports = { executeComponent, componentIds };