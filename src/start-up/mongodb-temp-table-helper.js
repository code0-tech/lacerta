const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const TempEntryDB = require('../mongo/TempEntryDB');
const MongoDb = new Mongo();


const start = async () => {
    try {
        const now = new Date();
        const expiredQuery = {
            validUntil: { $lt: now }
        };

        const expiredDocs = await MongoDb.find(ENUMS.DCB.TEMP, expiredQuery);

        if (expiredDocs.length == 0) return;
        console.log(`Deleting ${expiredDocs.length} expired documents...`);

        for (const doc of expiredDocs) {
            await MongoDb.deleteOne(ENUMS.DCB.TEMP, { _id: doc._id });
            console.log(`[TempEntryDB::Helper] Removed document for ${doc.identifier}.${doc.identifierAddition}`, Constants.CONSOLE.GOOD);
        }

    } catch (error) {
        console.log(`[TempEntryDB::Helper] Error on Search`, Constants.CONSOLE.ERROR);
    }
}

setInterval(() => {
    start();
}, 1000);


new TempEntryDB().setIdentifiers("lool").setValidTimeInSeconds(10).save()


module.exports = { start };