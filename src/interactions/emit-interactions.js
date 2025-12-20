const { Embed, COLOR } = require('./../models/Embed');
const Constants = require('./../../data/constants');
const { MongoUser } = require('../mongo/MongoUser');
const DcButtons = require('../singleton/DcButtons');
const { language } = require('./language-check');
const { Events } = require('discord.js');
const DC = require('./../singleton/DC');

const executionError = (interaction, info) => {
    if (interaction.deferred || interaction.replied) {
        new Embed()
            .setTitle('Error at Command Execution')
            .setColor(COLOR.DANGER)
            .setDescription(`An error occurred while processing your request\n\nMsg:\n\`${info}\``)
            .interactionResponse(interaction);
    }
};

const getGuildAndMember = async (client, userId) => {
    const guild = await DC.guildById(process.env.GUILD_ID, client);
    const member = await DC.memberById(userId, guild);
    return { guild, member };
};

const handleInteraction = async (interaction, client, handler, handlerType) => {
    let finalCommandName = null;
    try {
        const { guild, member } = await getGuildAndMember(client, interaction.user.id);

        let commandName;
        if (interaction.isCommand() || interaction.isAutocomplete()) {
            commandName = interaction.commandName;
        } else if (interaction.isMessageComponent()) {
            commandName = interaction.message.interaction
                ? interaction.message.interaction.commandName
                : client.components.get(interaction.customId.split('*')[0]).data.name;
        }

        if (!commandName) {
            console.log(`[Emit] Command name is undefined`, Constants.CONSOLE.ERROR);
            return;
        }

        finalCommandName = commandName;

        console.log(`[Emit] Handling interaction for command: ${commandName}`, Constants.CONSOLE.WORKING);

        const lang = await language(commandName, interaction, guild, client);

        if (!lang) {
            console.log(`[Emit] Specified language context was not given`, Constants.CONSOLE.ERROR);
            return;
        }

        const user = await new MongoUser(interaction.user.id).init();
        user.updateCommandUsage(finalCommandName, handlerType);

        await handler(interaction, client, guild, member, lang);
    } catch (error) {
        console.log(`[Emit] Command ${finalCommandName} failed, because command internal failed`, Constants.CONSOLE.ERROR);
        console.dir(error);
        const id = interaction.commandName || interaction.customId.split('*')[0];
        executionError(interaction, `${id} failed`);
    }
};

const commandHandler = async (interaction, client, guild, member, lang) => {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const dcInteraction = {
        interaction,
        client,
        guild,
        member,
        lang
    }

    await command.execute(dcInteraction);
};

const buttonHandler = async (interaction, client, guild, member, lang) => {
    const buttonData = DcButtons.decodeString(interaction.customId);
    const buttonCommand = client.components.get(buttonData.id);
    if (!buttonCommand) return;

    const dcInteraction = {
        interaction,
        client,
        guild,
        member,
        lang,
        buttonData,
        componentData: buttonData
    }

    await buttonCommand.executeComponent(dcInteraction);
};

const selectMenuHandler = async (interaction, client, guild, member, lang) => {
    const selectMenuData = DcButtons.decodeString(interaction.customId);
    selectMenuData.selected = interaction.values[0];
    const selectMenuCommand = client.components.get(selectMenuData.id);
    if (!selectMenuCommand) return;

    const dcInteraction = {
        interaction,
        client,
        guild,
        member,
        lang,
        componentData: selectMenuData
    }

    await selectMenuCommand.executeComponent(dcInteraction);
};

const autoCompleteHandler = async (interaction, client, guild, member, lang) => {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command || !command.autoComplete) return;

    const dcInteraction = {
        interaction,
        client,
        guild,
        member,
        lang
    }

    await command.autoComplete(dcInteraction);
};

const setup = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) {
            await handleInteraction(interaction, client, commandHandler, 'command');
        } else if (interaction.isButton()) {
            await handleInteraction(interaction, client, buttonHandler, 'button');
        } else if (interaction.isAutocomplete()) {
            await handleInteraction(interaction, client, autoCompleteHandler, 'autocomplete');
        } else if (interaction.isStringSelectMenu()) {
            await handleInteraction(interaction, client, selectMenuHandler, 'selectmenu');
        }
    });
};

module.exports = { setup };