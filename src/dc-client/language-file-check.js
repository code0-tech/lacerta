const { loadJSONFilesFromFolder } = require('../utils/json');
const Constants = require('./../../data/constants');
const path = require('path');

const checkLanguage = (exampleJson, langJson, langName) => {

    for (const exampleCommandKey in exampleJson) {
        if (langJson[exampleCommandKey]) {
            const commandTexts = Object.keys(langJson[exampleCommandKey]);

            exampleJson[exampleCommandKey].forEach(commandText => {
                if (!commandTexts.includes(commandText) && !commandText.startsWith('#')) { // Command text with # is just for one language
                    console.log(`[Lang Check] In file ${langName}, text for /${exampleCommandKey} with text "${commandText}" is missing.`, Constants.CONSOLE.ERROR);
                }
            });
        } else {
            if (!exampleCommandKey.startsWith('#')) {
                console.log(`[Lang Check] In file ${langName}, text for /${exampleCommandKey} is missing.`, Constants.CONSOLE.ERROR);
            }
        }
    }
};

const check = async () => {
    const folderPath = path.resolve(global.mainDir, 'languages');

    const files = await loadJSONFilesFromFolder(folderPath);

    const compareJson = files['english'];

    let exampleJson = [];

    for (const key in compareJson) {
        exampleJson[key] = Object.keys(compareJson[key]);
    }

    for (const key in files) {
        if (key !== 'english') {
            checkLanguage(exampleJson, files[key], key);
        }
    }
};

check();