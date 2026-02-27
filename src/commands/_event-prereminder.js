const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR } = require('../models/Embed');
const TempEntryDB = require("../mongo/TempEntryDB");
const { keyArray } = require('../utils/helper');
const { Thread } = require("../models/Thread");
const config = require('../../config.json');
const DC = require('../singleton/DC');

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, lang, componentData } = dcInteraction;

    await DC.defer(interaction);

    const tempEntry = await new TempEntryDB()
        .setIdentifiers('eventPreReminderInviteButtons')
        .restoreFromFilterByArray('messages', interaction.message.id);

    const data = tempEntry.getData();

    if (!data.messages) {
        await interaction.editReply({ content: "Sorry, no longer valid.", ephemeral: true });
        return;
    }

    const userId = member.id;
    data.acceptedInvite = (data.acceptedInvite || []).filter(id => id !== userId);
    data.unAcceptedInvite = (data.unAcceptedInvite || []).filter(id => id !== userId);

    if (componentData.acceptInvite == "1") {
        data.acceptedInvite.push(userId);
    } else {
        data.unAcceptedInvite.push(userId);
    }

    const channel = interaction.channel;

    tempEntry.setData(data);
    await tempEntry.save();

    const acceptedMentions = data.acceptedInvite.length > 0
        ? data.acceptedInvite.map(id => `<@${id}>`).join(', ')
        : '_None_';

    const declinedMentions = data.unAcceptedInvite.length > 0
        ? data.unAcceptedInvite.map(id => `<@${id}>`).join(', ')
        : '_None_';

    const attendanceText = [
        `**Total participants:** ${data.acceptedInvite.length}`,
        `✅ **Accepted (${data.acceptedInvite.length}):**`,
        acceptedMentions,
        '',
        `❌ **Declined (${data.unAcceptedInvite.length}):**`,
        declinedMentions
    ].join('\n');

    const listEmbed = new Embed()
        .setTitle("📅 Attendance Status")
        .setDescription(attendanceText)
        .setColor(COLOR.INFO);

    for (const msgId of data.messages) {
        try {
            const targetMsg = await channel.messages.fetch(msgId);
            const originalEmbedData = targetMsg.embeds[0]?.data || targetMsg.embeds[0];

            await targetMsg.edit({
                embeds: [originalEmbedData, listEmbed._embed.data],
                components: targetMsg.components
            });
        } catch (err) {
            console.error(`[Event PreReminder Attendance Status] Update failed for ${msgId}:`, err.message);
        }
    }

    await interaction.editReply({
        content: componentData.acceptInvite ? "Status updated!" : "Preference saved.",
        ephemeral: true
    });
};

// This code needs to be rewritten asap
// Add some anti spamming [embed edit timeout]
// also add that any new embed message for the same event should get this message to 
// if someone already has clicked any button [automatic]
// [27.02.2026]

const componentIds = [
    'eventPreReminderInviteButton'
];

module.exports = { executeComponent, componentIds, };