const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR } = require('./../models/Embed');
const { keyArray } = require('./../utils/helper');
const Constants = require('../../data/constants');
const { Thread } = require("../models/Thread");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const autoRun = async (client, Lang) => {
    const messages = await DC.messagesFromChannel(client, config.server.id, config.server.channels.application);
    const messagesIds = keyArray(messages);

    const LanguagePack = Lang
        .setHandlerType(Constants.LANGUAGE_SYSTEM.HANDLER_TYPES.AUTOMATIC)
        .setPackCommandPath('application')
        .buildPack()

    messagesIds.forEach(async (messageId) => {
        const message = messages.get(messageId);
        if (message.author.id !== client.application.id) {
            await message.delete();
        }
    });

    if (messagesIds.length !== 0) return;

    const applyButtonClosedTeam = new ButtonBuilder()
        .setCustomId('application-apply-closed-team')
        .setLabel(LanguagePack.string("buttonClosedTeam"))
        .setStyle(ButtonStyle.Primary);

    const applyButtonOpenContributor = new ButtonBuilder()
        .setCustomId('application-apply-open-contributor')
        .setLabel(LanguagePack.string("buttonOpenContributor"))
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
        .addComponents(applyButtonClosedTeam, applyButtonOpenContributor);

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(LanguagePack.embed("channelMessage", {
            teamId: config.server.roles.team
        }))
        .setComponents([row])
        .responseToChannel(config.server.channels.application, client)
};

const handleApplicationApply = async (interaction, client, guild, member, Lang, buttonData) => {

    let applicationTypeTextVar = 'applyMessages.openContributor';
    let threadTitle = 'threadTitle.openContributor';

    if (buttonData.id === 'application-apply-closed-team') {
        applicationTypeTextVar = 'applyMessages.closedTeam';
        threadTitle = 'threadTitle.closedTeam';
    }

    const newThread = await new Thread()
        .setName(Lang.string(threadTitle))
        .addMemberById(member.id)
        .addRole(config.server.roles.team)
        .createThread(interaction.channel);

    await new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed(applicationTypeTextVar))
        .responseToChannel(newThread.id, client);

    new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed("applicationTheadCreated"))
        .interactionResponse(interaction);
};

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, Lang, componentData } = dcInteraction;

    await DC.defer(interaction);

    if (componentData.id !== 'application-apply-closed-team' && componentData.id !== 'application-apply-open-contributor') return;

    handleApplicationApply(interaction, client, guild, member, Lang, componentData);
};

const componentIds = [
    'application-apply-closed-team',
    'application-apply-open-contributor'
];

module.exports = { executeComponent, componentIds, autoRun };