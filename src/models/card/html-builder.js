const { htmlItems } = require('./html-code');

const fillPlaceholders = (inputString, options) => {
    const regex = /PLACEHOLDER_([^*<]+)\*/g;

    const resultString = inputString.replace(regex, (match, placeholderName) => {
        const replacement = options.hasOwnProperty(placeholderName) ? options[placeholderName] : '';
        return replacement;
    });

    return resultString;
};

const traverseObject = (obj) => {
    let extraHtml = ``;

    if (obj.options.flags) {
        Object.keys(obj.options.flags).forEach(flag => {
            extraHtml = fillPlaceholders(htmlItems[obj.type][2][flag], obj.options);
        });
    }

    let htmlText = fillPlaceholders(htmlItems[obj.type][0], obj.options);

    if (obj.items && obj.items.length > 0) {
        htmlText += ` ${obj.items.map(item => traverseObject(item)).join(' ')} `;
    }

    htmlText += extraHtml + fillPlaceholders(htmlItems[obj.type][1], obj.options);

    return htmlText;
};

const convertJsonToHtml = async (json) => {
    let htmlText = ``;
    json.forEach(obj => {
        htmlText += traverseObject(obj);
    });

    const XHTMLText = `${htmlItems.xHtml[0]}${htmlText}${htmlItems.xHtml[1]}`;

    return XHTMLText;
};

// Info
// This code is from the early days of our bot's development and is now considered outdated. 
// It was originally used to create Cards, which were used as embeds.
// However, as our bot has evolved, we are transitioning to a more advanced and efficient system using discord-embeds.
// The embeds will replace the Cards, providing a richer, more interactive experience.
// ~Nicusch

module.exports = { convertJsonToHtml };