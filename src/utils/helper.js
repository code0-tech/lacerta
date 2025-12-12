const keyArray = (input) => {
    const keysIterator = input.keys();
    return Array.from(keysIterator);
};

const levenshteinDistance = (a, b) => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Format numbers for human readability with thousands separators (not included).
// Consider international conventions where commas (,) and periods (.) 
// may be reversed in different languages:
// 
// - German: 100000.00 => 100.000,00
// - English: 100000.00 => 100,000.00
//
// It's important to use localization libraries or functions to ensure
// consistent and accurate number formatting across diverse linguistic contexts.
//
// Despite a team member's insistence that differences exist (and that I shouldn't care),
// remember that formats for thousands separators can vary significantly between languages and locales.
const humanizeNumber = (number) => {
    const strNumber = String(number);
    const parts = strNumber.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';

    integerPart = integerPart.split('').reverse().join('');

    const formattedInteger = integerPart.match(/.{1,3}/g).join('.').split('').reverse().join('');

    const formattedNumber = decimalPart.length > 0 ? `${formattedInteger},${decimalPart}` : formattedInteger;

    return formattedNumber;
};

module.exports = { keyArray, levenshteinDistance, humanizeNumber };