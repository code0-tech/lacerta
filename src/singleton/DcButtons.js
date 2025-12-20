class DcButtons {
    /**
     * Creates a formatted Custom ID string for Discord Buttons / Interactions.
     * @param {string} name - The base ID/name (e.g., 'logs').
     * @param {Object} data - Key-value pairs to encode (e.g., {type: 'print'}).
     * @returns {string} - The formatted string: name*key1=val1*key2=val2
     */
    static createString(name, data = {}) {
        const parts = [name];

        for (const [key, value] of Object.entries(data)) {
            parts.push(`${key}=${value}`);
        }

        return parts.join('*');
    }

    /**
     * Decodes a Custom ID string back into an object.
     * @param {string} inputString - The string to decode.
     */
    static decodeString(inputString) {
        if (!inputString || !inputString.includes('*')) {
            return { id: inputString };
        }

        const parts = inputString.split('*');
        const id = parts[0];
        const result = { id };

        for (let i = 1; i < parts.length; i++) {
            const [key, value] = parts[i].split('=');
            // Basic type conversion: check if it's a number, otherwise return string
            result[key] = (value === undefined || value === '' || isNaN(value))
                ? value
                : Number(value);
        }

        return result;
    }
};

module.exports = DcButtons