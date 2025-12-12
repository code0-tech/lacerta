const { loadJSONFilesFromFolder } = require('../utils/json');
const path = require('path');

const load = (client) => {
    const folderPath = path.resolve(global.mainDir, 'languages');
    loadJSONFilesFromFolder(folderPath)
        .then(jsonData => {
            client.languages = jsonData;
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

module.exports = { load };