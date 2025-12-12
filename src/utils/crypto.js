const Constants = require('../../data/constants');
const crypto = require('crypto');

const key = crypto.scryptSync(process.env.CRYPTO_KEY, Constants.CRYPTO.SALT, Constants.CRYPTO.KEYLEN);

const encryptString = (string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(Constants.CRYPTO.ALGORITHM, key, iv);
    let encrypted = cipher.update(string, Constants.SETTINGS.ENCODING.UTF8, Constants.SETTINGS.ENCODING.HEX);
    encrypted += cipher.final(Constants.SETTINGS.ENCODING.HEX);
    return `${iv.toString(Constants.SETTINGS.ENCODING.HEX)}:${encrypted}`;
};

const decryptString = (encryptedString) => {
    if (!encryptedString || !encryptedString.includes(':')) {
        throw new Error('Invalid encrypted string format');
    }

    const [ivHex, encrypted] = encryptedString.split(':');

    const iv = Buffer.from(ivHex, Constants.SETTINGS.ENCODING.HEX);
    const decipher = crypto.createDecipheriv(Constants.CRYPTO.ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, Constants.SETTINGS.ENCODING.HEX, Constants.SETTINGS.ENCODING.UTF8);
    decrypted += decipher.final(Constants.SETTINGS.ENCODING.UTF8);
    return decrypted;
};

module.exports = { encryptString, decryptString };