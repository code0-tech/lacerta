const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Embed, COLOR } = require('./../models/Embed');
const DcButtons = require("../singleton/DcButtons");
const config = require('./../../config.json');
const DC = require('./../singleton/DC');
const Constants = require('../../data/constants');

const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your settings.')
    .setDescriptionLocalizations({ de: 'Ändere deine Einstellungen.' })
    .setDefaultMemberPermissions()
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

const backButtonActionRow = (lang) => {
    const backBtn = new ButtonBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'main' }))
        .setLabel(lang.getText('btn-back'))
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(backBtn)
}

const renderMainMenu = async (interaction, member, lang) => {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'menu' }))
        .setPlaceholder(lang.getText('select-menu-placeholder'))
        .addOptions([
            { label: lang.getText('menu-text-language'), value: 'language_role', emoji: Constants.DISCORD.EMOJIS.GLOBE }
        ]);

    await new Embed()
        .setColor(COLOR.INFO)
        .addContext(lang, member, 'main-page')
        .setComponents([new ActionRowBuilder().addComponents(selectMenu)])
        .interactionResponse(interaction);
};

const renderLanguageRoleSettings = async (interaction, member, lang) => {
    const currentRoleId = Object.keys(config.languageroles).find(id => DC.memberHasRoleId(member, id));

    const roleOptions = Object.entries(config.languageroles).map(([roleId, name]) => {
        const isCurrent = roleId === currentRoleId;

        return {
            label: name.charAt(0).toUpperCase() + name.slice(1),
            value: roleId,
            description: isCurrent ? lang.getText('text-current-language') : Constants.SYMBOLS.UNKOWN_01
        };
    });

    const roleSelect = new StringSelectMenuBuilder()
        .setCustomId(DcButtons.createString('settings', { type: 'language_saveRole' }))
        .setPlaceholder(lang.getText('role-select-placeholder'))
        .addOptions(roleOptions);

    const currentRoleName = currentRoleId ? config.languageroles[currentRoleId] : lang.getText('text-current-language-none');

    await new Embed()
        .setColor(COLOR.IN_PROGRESS)
        .addInputs({ currentRole: currentRoleName })
        .addContext(lang, member, 'settings-language-setup')
        .setComponents([
            new ActionRowBuilder().addComponents(roleSelect),
            backButtonActionRow(lang)
        ])
        .interactionResponse(interaction);
};

const componentHandlers = {
    main: renderMainMenu,
    menu: async (interaction, member, lang) => {
        const selection = interaction.values[0];
        if (selection === 'language_role') await renderLanguageRoleSettings(interaction, member, lang);
    },
    language_saveRole: async (interaction, member, lang) => {
        const newRoleId = interaction.values[0];

        const langRoleIds = Object.keys(config.languageroles);
        for (const roleId of langRoleIds) {
            if (DC.memberHasRoleId(member, roleId)) {
                await DC.memberRemoveRoleId(member, roleId);
            }
        }

        await DC.memberAddRoleId(member, newRoleId);

        await new Embed()
            .setColor(COLOR.SUCCESS)
            .addInputs({ role: DC.mentionRole(newRoleId) })
            .addContext(lang, member, 'settings-language-saved-success')
            .setComponents([
                backButtonActionRow(lang)
            ])
            .interactionResponse(interaction);
    }
};

const execute = async (interaction, client, guild, member, lang) => {
    await DC.defer(interaction);
    await renderMainMenu(interaction, member, lang);
};

const executeComponent = async (interaction, client, guild, member, lang, componentData) => {
    await DC.defer(interaction);
    const handler = componentHandlers[componentData.type];
    if (handler) await handler(interaction, member, lang);
};

const componentIds = ['settings'];
module.exports = { execute, data, componentIds, executeComponent };