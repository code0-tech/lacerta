const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR } = require('./../models/Embed');
const { keyArray } = require('./../utils/helper');
const { Thread } = require("../models/Thread");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


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

const handleApplicationApply = async (interaction, client, guild, member, lang, buttonData) => {
    let applicationTypeTextVar = '#apply-message-open-contributor';
    let threadTitle = '#thread-title-open-contributor';

    if (buttonData.id === 'application-apply-closed-team') {
        applicationTypeTextVar = '#apply-message-closed-team';
        threadTitle = '#thread-title-closed-team';
    }

    const newThread = await new Thread()
        .setName(`${member.user.username} ${lang.getText(threadTitle)}`)
        .addMemberById(member.id)
        .addRole(config.roles.team)
        .createThread(interaction.channel);

    await new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, applicationTypeTextVar)
        .responseToChannel(newThread.id, client);

    new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, '#new-application-thread')
        .interactionResponse(interaction);
};

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, lang, componentData } = dcInteraction;

    await DC.defer(interaction);

    if (componentData.id !== 'application-apply-closed-team' && componentData.id !== 'application-apply-open-contributor') return;

    handleApplicationApply(interaction, client, guild, member, lang, componentData);
};

const componentIds = [
    'application-apply-closed-team',
    'application-apply-open-contributor'
];

module.exports = { executeComponent, componentIds, autoRun };