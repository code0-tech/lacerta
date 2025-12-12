const { AttachmentBuilder, Attachment } = require("discord.js");
const { convertJsonToHtml } = require('./html-builder');
const Constants = require('../../../data/constants');

class Card {
    constructor() {
        this._cards = [];

        this._ephemeral = true;
        this._components = [];
        this._content = null;
    }

    /**
     * Get the cards[] containing the .
     * @returns {this._cards[]} - The Cards Array.
     */
    getJson() {
        return this._cards;
    }

    /**
     * Get the current generated Html by using the Json from this Class.
     * @returns {string} - Html as a String.
     */
    async getHtml() {
        const cardsHtml = await convertJsonToHtml(this._cards);
        return cardsHtml;
    }

    /**
     * Get the Attachment for Discord filled with the ImageBuffer from the Html screenshot.
     * @returns {Attachment} - Image Attachment.
     */
    async getAttachment() {
        const page = await global.renderPuppeteer.newPage();

        await page.setContent(await this.getHtml());

        await page.waitForSelector('.card');

        const elementHandle = await page.$('.card');
        const array8 = await elementHandle.screenshot({ omitBackground: true });

        await page.close();

        const uint8ArrayData = new Uint8Array(array8);
        const bufferData = Buffer.from(uint8ArrayData);

        const attachment = new AttachmentBuilder(bufferData, { name: Constants.DISCORD.EMBED_IMAGE_NAME.BUILDER.DEFAULT_PNG_01 });

        console.log(`[Puppeteer: Card] created a new card.`, Constants.CONSOLE.WORKING);

        return attachment;
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
    * Send a response to an interaction.
    * @param {Interaction} interaction - The interaction object.
    * @returns {Promise<void>} - A promise that resolves when the message is sent.
    */
    async interactionResponse(interaction) {
        const attachment = await this.getAttachment()

        const responseOptions = {
            content: this._content,
            components: this._components,
            files: [attachment],
            ephemeral: this._ephemeral
        };

        let interactionReply = undefined;

        try {
            interactionReply = await interaction.editReply(responseOptions);
        } catch (error) {
            if (error.code === 50027) {
                interactionReply = null;
            } else {
                throw error;
            }
        }

        return interactionReply;
    }

    _addCard(type, options = {}, fn = () => { }) {
        const card = new Card();
        fn(card);

        this._cards.push({ type, options, items: card._cards });
        return this;
    }

    /**
    * Sets header
    * @param {Object} options - Header options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    header(options = {}, fn = () => { }) {
        return this._addCard('header', options, fn);
    }

    /**
    * Sets headerWrapper
    * @param {Object} options - headerWrapper options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    headerWrapper(options = {}, fn = () => { }) {
        return this._addCard('headerWrapper', options, fn);
    }

    /**
    * Sets body
    * @param {Object} options - Body options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    body(options = {}, fn = () => { }) {
        return this._addCard('body', options, fn);
    }

    /**
    * Sets footer
    * @param {Object} options - Footer options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    footer(options = {}, fn = () => { }) {
        return this._addCard('footer', options, fn);
    }

    /**
    * Sets headerIcon
    * @param {Object} options - HeaderIcon options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    headerIcon(options = {}, fn = () => { }) {
        return this._addCard('headerIcon', options, fn);
    }

    /**
    * Sets headerTitle
    * @param {Object} options - HeaderTitle options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    headerTitle(options = {}, fn = () => { }) {
        return this._addCard('headerTitle', options, fn);
    }

    /**
    * Sets footerIcon
    * @param {Object} options - FooterIcon options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    footerIcon(options = {}, fn = () => { }) {
        return this._addCard('footerIcon', options, fn);
    }

    /**
    * Sets footerTitle
    * @param {Object} options - FooterTitle options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    footerTitle(options = {}, fn = () => { }) {
        return this._addCard('footerTitle', options, fn);
    }

    /**
    * Sets divider
    * @param {Object} options - Divider options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    divider(options = {}, fn = () => { }) {
        return this._addCard('divider', options, fn);
    }

    /**
    * Sets title
    * @param {Object} options - Title options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    title(options = {}, fn = () => { }) {
        return this._addCard('title', options, fn);
    }

    /**
    * Sets label
    * @param {Object} options - Label options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    label(options = {}, fn = () => { }) {
        return this._addCard('label', options, fn);
    }

    /**
    * Sets subTitle
    * @param {Object} options - SubTitle options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    subTitle(options = {}, fn = () => { }) {
        return this._addCard('subTitle', options, fn);
    }

    /**
    * Sets description
    * @param {Object} options - Description options.
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    description(options = {}, fn = () => { }) {
        return this._addCard('description', options, fn);
    }

    /**
    * Sets progressBar
    * @param {Object} options - ProgressBar options [label: false|true].
    * @param {Function} fn - Callback function to customize the nested Element.
    * @returns {ThisType<Card>} - Returns an instance of the Card class.
    */
    progressBar(options = {}, fn = () => { }) {
        if (options.label) {
            options['flags'] = {
                label: true
            }
        }

        if (options.value > 100) options.value = 100;

        return this._addCard('progressBar', options, fn);
    }

};


const calculatePercentage = (total, whole) => {
    return (total / whole) * 100;
};


// Info
// This code is from the early days of our bot's development and is now considered outdated. 
// It was originally used to create Cards, which were used as embeds.
// However, as our bot has evolved, we are transitioning to a more advanced and efficient system using discord-embeds.
// The embeds will replace the Cards, providing a richer, more interactive experience.
// ~Nicusch

module.exports = { Card, calculatePercentage };