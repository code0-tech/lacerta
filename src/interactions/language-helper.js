const Constants = require('../../data/constants');
const config = require('../../config.json');

const languageRoles = config.server.languageRoles;
const defaultLangLocal = "en";

class LanguageHelper {
    constructor(client) {
        this.languages = client?.languages || {};

        this.userlang = defaultLangLocal;
        this.userLanguageRoleId = null;
        this.member = null;
        this.commandName = null;
        this.handlerType = null;
        this.interaction = null;
        this.guild = null;
        this.languageCommandPack = {};
    }

    setCommandName(fullCommandName) {
        this.commandName = fullCommandName ? fullCommandName.split(" ")[0] : null;
        return this;
    }

    setHandlerType(handlerType) {
        this.handlerType = handlerType;
        return this;
    }

    setInteraction(interaction) {
        this.interaction = interaction;
        return this;
    }

    setGuild(guild) {
        this.guild = guild;
        return this;
    }

    async create() {
        if (this.guild && this.interaction) {
            try {
                this.member = await this.guild.members.fetch(this.interaction.user.id);

                for (const languageRoleId of Object.keys(languageRoles)) {
                    if (this.member.roles.cache.has(languageRoleId)) {
                        this.userlang = languageRoles[languageRoleId];
                        this.userLanguageRoleId = languageRoleId;
                    }
                }
                console.log(`[LanguageHelper::Create] Found language Role using "${this.userlang}" local for member`, Constants.CONSOLE.GOOD);
            } catch (error) {
                console.log(`[LanguageHelper::Create] Couldn't fetch member details. Defaulting to "${defaultLangLocal}".`, Constants.CONSOLE.ERROR);
            }
        }

        if (this.commandName) {
            let userLocalCommandPack = this.languages[this.userlang]?.[this.commandName];
            if (!userLocalCommandPack) {
                userLocalCommandPack = this.languages[defaultLangLocal]?.[this.commandName] || {};
            }
            this.languageCommandPack = userLocalCommandPack;
        }

        return this;
    }

    _replacePlaceholders(template, data) {
        if (typeof template !== 'string') return '';
        return template.replace(/{([^{}]*)}/g, (match, key) => {
            const trimmedKey = key.trim();
            if (data == null) return '';
            if (data[trimmedKey] === undefined) return '';
            return data[trimmedKey];
        });
    }

    embed(contextPath, variables) {
        if (!contextPath) return null;


    }

    getLanguageRoleId() {
        return this.userLanguageRoleId;
    }
}

module.exports = { LanguageHelper };