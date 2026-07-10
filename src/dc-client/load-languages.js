const { loadJSONFilesFromFolder } = require('../utils/json');
const path = require('path');

const load = (client) => {
    const folderPath = path.resolve(global.mainDir, 'data', 'languages');
    loadJSONFilesFromFolder(folderPath)
        .then(jsonData => {
            client.languagePack = jsonData;
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

module.exports = { load };