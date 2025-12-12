const stringToHash = (str, seed) => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

const intToRGB = (i) => {
    const r = (i >> 16) & 0xFF;
    const g = (i >> 8) & 0xFF;
    const b = i & 0xFF;
    return `rgb(${r},${g},${b})`;
};

const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (r, g, b) => {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getColorByString = (string, seed) => {
    const hash = stringToHash(string, seed);
    const rgb = intToRGB(hash);
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return rgbToHex(r, g, b);
};

module.exports = { stringToHash, intToRGB, toHex, rgbToHex, getColorByString };