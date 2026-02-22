const Constants = require('./../../data/constants');
const config = require('./../../config.json');

const languageRoles = config.server.languageRoles;

const language = async (fullCommandName, interaction, guild, client) => {
    const { languages } = client;
    const member = await guild.members.fetch(interaction.user.id);
    let baseLanguage = 'english';

    let userLanguageRoleId = null;

    for (const languageRoleId of Object.keys(languageRoles)) {
        if (member.roles.cache.has(languageRoleId)) {
            baseLanguage = languageRoles[languageRoleId];
            userLanguageRoleId = languageRoleId;
        }
    }

    const commandName = fullCommandName.split(" ")[0];

    let commandText = languages[baseLanguage]?.[commandName] || '';

    if (!commandText) {
        commandText = languages['english']?.[commandName] || '';
    }

    return {
        userlang: baseLanguage,
        text: commandText,
        _replacePlaceholders(template, data) {
            return template.replace(/{([^{}]*)}/g, (match, key) => {

                if (data == null) {
                    console.log(`[Lang Error] no inputs where given at all. Missing Placeholder replace for "${key}".`, Constants.CONSOLE.ERROR);
                    return '';
                }

                if (data[key.trim()] == undefined) {
                    console.log(`[Lang Error] a Placeholder "${key}" was not found as an input.`, Constants.CONSOLE.ERROR);
                    return '';
                }
                return data[key.trim()];
            });
        },
        getText(key, replaceOptions = null) {
            const text = commandText;

            if (text[key] == undefined) {
                console.log(`[Lang Error] language key "${key}" for the "${commandName}" command was not found in the user language.`, Constants.CONSOLE.ERROR);
                return '';
            }

            const finalText = this._replacePlaceholders(text[key], replaceOptions);
            return finalText;
        },
        getLanguageRoleId() {
            return userLanguageRoleId;
        }
    };
};

// What a prefix means

// "_" => its not a slash command, e.g button interaction.
// "#"" => its only for one language as its used global for everyone on the server.

module.exports = { language };