const Constants = require('./../../data/constants');
const { EmbedBuilder } = require("discord.js");
const config = require('./../../config.json');

const embedColors = config.server.embeds.colors;

const replacePlaceHolders = (template, data) => {
    return template.replace(/{([^{}]*)}/g, (match, key) => {
        if (data[key.trim()] == undefined) {
            console.log(`[Embed PlaceHolder Replace] a Placeholder "${key}" was not found as an input.`, Constants.CONSOLE.ERROR)
            return '';
        }
        return data[key.trim()];
    });
}

class Embed {
    constructor() {
        /** @type {MessageEmbed} */
        this._embed = new EmbedBuilder();

        this._ephemeral = true;
        this._components = [];
        this._files = [];
        this._content = null;

        this._pin = false;

        this._inputs = {};
    }

    /**
     * Set the color of the embed.
     * @param {string} color - The color to set.
     */
    setColor(color) {
        this._embed.setColor(color);
        return this;
    }

    /**
     * Set the title of the embed.
     * @param {string} text - The text to set as the title.
     */
    setTitle(text) {
        this._embed.setTitle(text);
        return this;
    }

    /**
     * Set the URL of the embed.
     * @param {string} url - The URL to set.
     */
    setURL(url) {
        this._embed.setURL(url);
        return this;
    }

    /**
    * Set the author information for the embed.
    * @param {{ name: string, iconURL?: string, url?: string }} authorObj - The object containing author information.
    */
    setAuthor(authorObj) {
        if (authorObj.name) {
            this._embed.setAuthor(authorObj);
        }
        return this;
    }

    /**
     * Set the description for the embed.
     * @param {string} description - The description to set.
     */
    setDescription(description) {
        if (description) {
            this._embed.setDescription(description);
        }
        return this;
    }

    /**
     * Set the thumbnail for the embed.
     * @param {string} url - The URL of the thumbnail.
     */
    setThumbnail(url) {
        if (url) {
            this._embed.setThumbnail(url);
        }
        return this;
    }

    /**
     * Set the thumbnail for the embed.
     * @param {string} url - The URL of the thumbnail.
     */
    setPbThumbnail(member) {
        this._embed.setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        return this;
    }

    /**
     * Add fields to the embed.
     * @param {{ name: string, value: string, inline?: boolean }[]} fieldsObj - The array of fields.
     */
    addFields(fieldsObj) {
        if (fieldsObj) {
            this._embed.addFields(fieldsObj);
        }
        return this;
    }

    /**
     * Set the image for the embed.
     * @param {string} url - The URL of the image.
     */
    setImage(url) {
        if (url) {
            this._embed.setImage(url);
        }
        return this;
    }

    /**
     * Set the timestamp for the embed.
     */
    setTimestamp() {
        this._embed.setTimestamp();
        return this;
    }

    /**
     * Set the footer information for the embed.
     * @param {string} text - The text of the footer.
     * @param {string} [iconURL] - The URL of the footer's icon.
     */
    setFooter(text, iconURL = null) {
        if (text) {
            this._embed.setFooter({ text: text, icon_url: iconURL })
        }
        return this;
    }

    /**
     * Get the underlying MessageEmbed object.
     * @returns {MessageEmbed} - The MessageEmbed object.
     */
    getEmbed() {
        return this._embed;
    }

    /**
     * Used by .addContext().
     */
    _replacePlaceholders(template, data) {
        return replacePlaceHolders(template, data);
    }

    /**
     * Add values that will replace the Text values.
     * @param {json} inputs - Replace the placeholder values.
     */
    addInputs(inputs) {
        this._inputs = inputs;

        return this;
    }

    /**
     * Set the Context of the Embed based on Inputs and Lang.
     * @param {json} lang - Language pack delivered by emit-interaction on any Interaction.
     * @param {member} member - Member from the Interaction.
     * @param {id} contextId - Id for the Embed language pack.
     */
    addContext(lang, member, contextId) {
        const embedContext = lang.text[contextId];

        if (embedContext == undefined) {
            console.log(`[Embed Error] Given contextId: ${contextId} is not part of this command.`, Constants.CONSOLE.ERROR);
            return this;
        }

        const contextKey = Object.keys(embedContext);

        if (member !== null) {
            this._inputs['username'] = member.user.username;
            this._inputs['userid'] = member.user.id;
        }

        contextKey.forEach((inputType) => {
            const inputTypeText = embedContext[inputType];
            const finalText = this._replacePlaceholders(inputTypeText, this._inputs);

            switch (inputType) {
                case 'description':
                    this.setDescription(finalText);
                    break;
                case 'title':
                    this.setTitle(finalText);
                    break;
                default:
                    break;
            }
        });

        return this;
    }

    /** 
    * @param {boolean} [ephemeral=true] - Whether the response should be ephemeral. 
    */
    setEphemeral(ephemeral = true) {
        this._ephemeral = ephemeral;
        return this;
    }

    /** 
    * @param {MessageActionRow[]} [components] - The components to include in the message.
    */
    setComponents(components = []) {
        this._components = components;
        return this;
    }

    /** 
    * @param {boolean} [ephemeral=true] - Whether the response should be ephemeral. 
    */
    setContent(content = null) {
        this._content = content;
        return this;
    }

    /** 
    * @param {MessageAttachment|null} [attachment=null] - Optional attachment to include in the response.
    */
    setAttachment(attachment) {
        this._files.push(attachment);
        return this;
    }

    /**
     * Send a response to an interaction.
     * @param {Interaction} interaction - The interaction object.
     * @returns {Promise<void>} - A promise that resolves when the message is sent.
     */
    async interactionResponse(interaction) {
        try {
            const responseOptions = {
                content: this._content,
                embeds: [this.getEmbed()],
                components: this._components,
                files: this._files,
                ephemeral: this._ephemeral
            };

            let interactionReply = undefined;

            try {
                interactionReply = await interaction.editReply(responseOptions);
            } catch (error) {
                if (error.code === 50027) {
                    interactionReply = null;
                    console.log(`[Embed] Error "${error.code}", invalid Token [possible reason: +15update message]`, Constants.CONSOLE.ERROR);
                } else {
                    console.log(`[Embed] Error while sending Embed`, Constants.CONSOLE.ERROR);
                    throw error;
                }
            }

            return interactionReply;
        } catch (error) {
            console.log(`[Embed] Error while sending Embed`, Constants.CONSOLE.ERROR);
            throw error;
        }
    }

    /** 
    * @param {boolean} [pin=true] - Whether to pin the sent message (default: false), works with .responseToChannel only.
    */
    setPin(pin = true) {
        this._pin = pin;
        return this;
    }

    /**
    * Internal helper to handle the message sending and pinning logic.
    * @private
    */
    async #sendAndPin(target, options) {
        try {
            const messageResponse = await target.send({
                content: this._content,
                embeds: [this.getEmbed()],
                components: this._components,
                files: this._files,
                ephemeral: this._ephemeral
            });

            if (this._pin) {
                await messageResponse.pin().catch(err =>
                    console.warn(`Failed to pin message: ${err.message}`)
                );
            }

            return messageResponse;
        } catch (error) {
            console.error(`Error sending message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send a message to a specific channel with optional components and pin the message.
    * @param {string} channelId - The ID of the channel (or Thread) to send the message to.
    * @param {Client} client - The client to send the message from.
    * @returns {Promise<void>} - A promise that resolves when the message is sent.
    */
    async responseToChannel(channelId, client) {
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased()) console.log(`[Embed] Channel not found`, Constants.CONSOLE.ERROR);

        return this.#sendAndPin(channel);
    }

    /**
    * Send a message to a specific channel with optional components and pin the message.
    * @param {Interaction} interaction - The interaction object.
    * @returns {Promise<void>} - A promise that resolves when the message is sent.
    */
    async responseToChannelByInteraction(interaction) {
        if (!interaction.channel) throw console.log(`[Embed] Channel cannot be found by Interaction`, Constants.CONSOLE.ERROR);

        return this.#sendAndPin(interaction.channel);
    }
}

class COLOR {
    static get BACKGROUND() {
        return embedColors.background;
    }
    static get PRIMARY() {
        return embedColors.primary;
    }
    static get SECONDARY() {
        return embedColors.secondary;
    }
    static get INFO() {
        return embedColors.info;
    }
    static get SUCCESS() {
        return embedColors.success;
    }
    static get WARNING() {
        return embedColors.warning;
    }
    static get IN_PROGRESS() {
        return embedColors.inprogress;
    }
    static get DANGER() {
        return embedColors.danger;
    }
    static get BLACK() {
        return embedColors.black;
    }
    static get WHITE() {
        return embedColors.white;
    }
}

const progressBar = (total, whole, info = true, segments = 10) => {
    if (total > whole) {
        total = 100;
        whole = 100;
    }

    const percentage = ((total / whole) * 100).toFixed(2);

    let filledSegments = Math.round((percentage / 100) * segments);
    let emptySegments = segments - filledSegments;

    let string = '';
    let end = '';

    if (filledSegments >= segments) {
        end = Constants.DISCORD.EMOJIS.CUSTOM.PBR1;
        filledSegments--;
    } else {
        end = Constants.DISCORD.EMOJIS.CUSTOM.PBR0;
        if (emptySegments > 0) {
            emptySegments--;
        }
    }

    if (filledSegments >= 1) {
        string = Constants.DISCORD.EMOJIS.CUSTOM.PBL1;
        if (filledSegments == 0) {
            emptySegments--;
        } else {
            filledSegments--;
        }
    } else {
        emptySegments--;
        string = Constants.DISCORD.EMOJIS.CUSTOM.PBL0;
    }

    string += Constants.DISCORD.EMOJIS.CUSTOM.PBM1.repeat(filledSegments);
    string += Constants.DISCORD.EMOJIS.CUSTOM.PBM0.repeat(emptySegments);

    if (info) {
        end += " " + percentage + "%";
    }

    return string + end;
};

module.exports = { Embed, COLOR, progressBar, replacePlaceHolders };