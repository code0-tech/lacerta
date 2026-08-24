const Constants = require('../../data/constants');
const config = require('../../config.json');
const DC = require('../singleton/DC');

const languageRoles = config.server.languageRoles;

class LanguageHelper {
    constructor(client) {
        this.setLanguages(client?.languages || {});

        this.defaultLangLocal = Constants.LANGUAGE_SYSTEM.DEFAULTS.LOCAL

        this.setUserlang(this.defaultLangLocal);
        this.setUserLanguageRoleId(null);
        this.setMember(null);
        this.setCommandName(null);
        this.setHandlerType(null);
        this.setInteraction(null);
        this.setGuild(null);
        this.setInteractionLanguagePack({});
        this.setStandAlone(false);
    }

    // Getters & Setters
    getLanguages() {
        return this.languages;
    }

    setLanguages(languages) {
        this.languages = languages;
        return this;
    }

    getUserlang() {
        return this.userlang;
    }

    setUserlang(userlang) {
        this.userlang = userlang;
        return this;
    }

    getLanguageRoleId() {
        return this.userLanguageRoleId;
    }

    setUserLanguageRoleId(userLanguageRoleId) {
        this.userLanguageRoleId = userLanguageRoleId;
        return this;
    }

    getMember() {
        return this.member;
    }

    setMember(member) {
        this.member = member;
        return this;
    }

    getCommandName() {
        return this.commandName;
    }

    setCommandName(fullCommandName) {
        this.commandName = fullCommandName ? fullCommandName.split(" ")[0] : null;
        return this;
    }

    getHandlerType() {
        return this.handlerType;
    }

    setHandlerType(handlerType) {
        this.handlerType = handlerType;
        return this;
    }

    getInteraction() {
        return this.interaction;
    }

    setInteraction(interaction) {
        this.interaction = interaction;
        return this;
    }

    getGuild() {
        return this.guild;
    }

    setGuild(guild) {
        this.guild = guild;
        return this;
    }

    getInteractionLanguagePack() {
        return this.interactionLanguagePack;
    }

    setInteractionLanguagePack(interactionLanguagePack) {
        this.interactionLanguagePack = interactionLanguagePack;
        return this;
    }

    setPackCommandPath(commandPath) {
        this.setCommandName(commandPath);
        return this;
    }

    getStandAloneStatus() {
        return this.standAlone || false;
    }

    setStandAlone(boolean) {
        this.standAlone = boolean;
        return this;
    }

    createStandalonePack() {
        this.setStandAlone();
        return this;
    }

    buildPack() {
        const commandName = this.getCommandName();
        if (!commandName) return this;

        const languages = this.getLanguages();
        const userlang = this.getUserlang();
        const handlerType = this.getHandlerType();

        let interactionLanguagePack = languages[userlang]?.[handlerType]?.[commandName];

        if (!interactionLanguagePack) {
            interactionLanguagePack = languages[this.defaultLangLocal]?.[handlerType]?.[commandName] || {};
        }
        this.setInteractionLanguagePack(interactionLanguagePack);

        return this;
    }

    async create() {
        const guild = this.getGuild();
        const interaction = this.getInteraction();

        if (guild && interaction) {
            try {
                const member = await guild.members.fetch(interaction.user.id);
                this.setMember(member);

                for (const languageRoleId of Object.keys(languageRoles)) {
                    if (member.roles.cache.has(languageRoleId)) {
                        this.setUserlang(languageRoles[languageRoleId]);
                        this.setUserLanguageRoleId(languageRoleId);
                    }
                }
                console.log(`[LanguageHelper::Create] Found language Role using "${this.getUserlang()}" local for member`, Constants.CONSOLE.GOOD);
            } catch (error) {
                console.log(`[LanguageHelper::Create] Couldn't fetch member details. Defaulting to "${defaultLangLocal}".`, Constants.CONSOLE.ERROR);
            }
        }

        this.buildPack();

        return this;
    }

    _replacePlaceholders(template, data) {
        if (typeof template !== 'string') return '';
        return template.replace(/{([^{}]*)}/g, (match, key) => {
            const trimmedKey = key.trim();
            if (data == null) return '';

            const targetKey = Object.keys(data).find(k => k.toLowerCase() === trimmedKey.toLowerCase()) || trimmedKey;

            if (data[targetKey] === undefined) return match;
            return data[targetKey];
        });
    }

    _processPlaceholdersInObject(obj, variables) {
        if (typeof obj === 'string') {
            const processed = this._replacePlaceholders(obj, variables);
            return processed;
        }

        if (Array.isArray(obj)) {
            return obj.map((item, index) => {
                return this._processPlaceholdersInObject(item, variables);
            });
        }

        if (typeof obj === 'object' && obj !== null) {
            console.log('[LanguageHelper::Replace] Processing object properties', Constants.CONSOLE.GOOD);
            const result = {};

            for (const [key, value] of Object.entries(obj)) {
                if (
                    key === Constants.LANGUAGE_SYSTEM.DATA_TYPES.VARIABLES_KEY ||
                    key === Constants.LANGUAGE_SYSTEM.DATA_TYPES.TYPE_KEY
                ) {
                    result[key] = value;
                    continue;
                }

                result[key] = this._processPlaceholdersInObject(value, variables);
            }

            return result;
        }

        return obj;
    }

    /**
    * Resolves an object path using dot notation or a single key.
    * @param {Object} obj 
    * @param {string} path - e.g. "command.contributor.infoMessage" OR "infoMessage"
    * @returns {any}
    */
    _getNestedValue(obj, path) {
        if (!obj || !path) return null;

        return path.split('.').reduce((acc, part) => {
            return (acc && acc[part] !== undefined) ? acc[part] : null;
        }, obj);
    }

    embed(contextPath, variables = {}) {
        if (!contextPath) return null;

        const interactionLanguagePack = this.getInteractionLanguagePack();

        const embedLanguagePack = this._getNestedValue(interactionLanguagePack, contextPath) || null;

        if (!embedLanguagePack) {
            console.log(`[LanguageHelper::embed] Context path "${contextPath}" not found.`, Constants.CONSOLE.ERROR);
            return null;
        }

        if (embedLanguagePack[Constants.LANGUAGE_SYSTEM.DATA_TYPES.TYPE_KEY] !== Constants.LANGUAGE_SYSTEM.DATA_TYPES.DISCORD_EMBED) {
            console.log(`[LanguageHelper::embed] interactionLanguagePack with contextPath: ${contextPath} has no embed type`, Constants.CONSOLE.ERROR);
            return {};
        }

        const member = this.getMember();

        const memberVariables = {
            memberName: DC.getMemberName(member) || '',
            memberUserName: DC.getMemberUsername(member) || '',
            memberNickname: DC.getMemberNickname(member) || ''
        };

        const combinedVariables = {
            ...memberVariables,
            ...variables
        };

        const formattedEmbedPack = this._processPlaceholdersInObject(embedLanguagePack, combinedVariables);

        return {
            ...formattedEmbedPack,
            member
        };
    }

    string(contextPath, variables = {}) {
        if (!contextPath) return null;

        const interactionLanguagePack = this.getInteractionLanguagePack();

        const stringPack = this._getNestedValue(interactionLanguagePack, contextPath) || null;

        // what if the context path is like "application.title"
        // this means i need to get to that json object but how?

        if (!stringPack) {
            console.log(`[LanguageHelper::string] Context path "${contextPath}" not found.`, Constants.CONSOLE.ERROR);
            return null;
        }

        if (stringPack[Constants.LANGUAGE_SYSTEM.DATA_TYPES.TYPE_KEY] !== Constants.LANGUAGE_SYSTEM.DATA_TYPES.STRING) {
            console.log(`[LanguageHelper::string] interactionLanguagePack with contextPath: ${contextPath} has no string type`, Constants.CONSOLE.ERROR);
            return {};
        }

        const singleString = stringPack.string;

        const member = this.getMember();

        const memberVariables = {
            memberName: DC.getMemberName(member) || '',
            memberUserName: DC.getMemberUsername(member) || '',
            memberNickname: DC.getMemberNickname(member) || ''
        };

        const combinedVariables = {
            ...memberVariables,
            ...variables
        };

        const formattedString = this._replacePlaceholders(singleString, combinedVariables);

        return formattedString;
    }
}

module.exports = { LanguageHelper };