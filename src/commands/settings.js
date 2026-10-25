const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Embed, COLOR } = require('./../models/Embed');
const DcButtons = require("../singleton/DcButtons");
const Constants = require('../../data/constants');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');

const dcLanguageRoles = config.server.languageRoles;

const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your settings.')
    .setDescriptionLocalizations({ de: 'Ändere deine Einstellungen.' })
    .setDefaultMemberPermissions()
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

const backButtonActionRow = (Lang) => {
    const backBtn = new ButtonBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'main' }))
        .setLabel(Lang.string('texts.btn-back'))
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(backBtn)
};

const renderMainMenu = async (interaction, member, Lang) => {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'menu' }))
        .setPlaceholder(Lang.string('texts.select-menu-placeholder'))
        .addOptions([
            { label: Lang.string('texts.menu-text-language'), value: 'language_role', emoji: Constants.DISCORD.EMOJIS.GLOBE }
        ]);

    await new Embed()
        .setColor(COLOR.INFO)
        .addLangContext(Lang.embed('main-page'))
        .setComponents([new ActionRowBuilder().addComponents(selectMenu)])
        .interactionResponse(interaction);
};

const renderLanguageRoleSettings = async (interaction, member, Lang) => {
    const currentRoleId = Object.keys(dcLanguageRoles).find(id => DC.memberHasRoleId(member, id));

    const roleOptions = Object.entries(dcLanguageRoles).map(([roleId, name]) => {
        const isCurrent = roleId === currentRoleId;

        return {
            label: name.charAt(0).toUpperCase() + name.slice(1),
            value: roleId,
            description: isCurrent ? Lang.string('texts.current-language') : Constants.SYMBOLS.UNKOWN_01
        };
    });

    const roleSelect = new StringSelectMenuBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'language_saveRole' }))
        .setPlaceholder(Lang.string('texts.role-select-placeholder'))
        .addOptions(roleOptions);


    const currentRoleName = currentRoleId ? dcLanguageRoles[currentRoleId] : Lang.string('texts.current-language-none');

    await new Embed()
        .setColor(COLOR.IN_PROGRESS)
        .addLangContext(Lang.embed('language-setup', { currentRole: currentRoleName }))
        .setComponents([
            new ActionRowBuilder().addComponents(roleSelect),
            backButtonActionRow(Lang)
        ])
        .interactionResponse(interaction);
};

const componentHandlers = {
    main: renderMainMenu,
    menu: async (interaction, member, Lang) => {
        const selection = interaction.values[0];
        if (selection === 'language_role') await renderLanguageRoleSettings(interaction, member, Lang);
    },
    language_saveRole: async (interaction, member, Lang) => {
        const newRoleId = interaction.values[0];

        const langRoleIds = Object.keys(dcLanguageRoles);
        for (const roleId of langRoleIds) {
            if (DC.memberHasRoleId(member, roleId)) {
                await DC.memberRemoveRoleId(member, roleId);
            }
        }

        await DC.memberAddRoleId(member, newRoleId);

        await new Embed()
            .setColor(COLOR.SUCCESS)
            .addLangContext(Lang.embed('language-saved-success', { role: DC.mentionRole(newRoleId) }))
            .setComponents([
                backButtonActionRow(Lang)
            ])
            .interactionResponse(interaction);
    }
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, Lang } = dcInteraction;

    await DC.defer(interaction);
    await renderMainMenu(interaction, member, Lang);
};

const executeComponent = async (dcInteraction) => {
    const { interaction, client, guild, member, Lang, componentData } = dcInteraction;

    await DC.defer(interaction);
    const handler = componentHandlers[componentData.type];
    if (handler) await handler(interaction, member, Lang);
};

const componentIds = ['settings'];
module.exports = { execute, data, componentIds, executeComponent };