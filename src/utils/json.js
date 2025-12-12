const Constants = require('./../../data/constants');
const fs = require('fs').promises;
const path = require('path');

const loadJSONFilesFromFolder = async (folderPath) => {
    try {
        const files = await fs.readdir(folderPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const jsonData = {};

        for (const file of jsonFiles) {
            const fileName = file.replace('.json', '');
            const filePath = path.join(folderPath, file);
            const fileContent = await fs.readFile(filePath, Constants.SETTINGS.ENCODING.UTF8);
            jsonData[fileName] = JSON.parse(fileContent);
        }

        return jsonData;

    } catch (error) {
        console.error('Error loading JSON files from folder:', error);
        return null;
    }
};

module.exports = { loadJSONFilesFromFolder };