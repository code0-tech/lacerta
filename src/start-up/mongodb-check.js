const Constants = require('./../../data/constants');
const { Mongo, ENUMS } = require('../models/Mongo');
const MongoDb = new Mongo();

const checkDuplicate = async () => {
    const results = await MongoDb.aggregate(ENUMS.DCB.USERS, [
        { $group: { _id: '$id', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } }
    ]);

    results.forEach(async (doublePackets) => {
        console.log(`[MongoDb Check] found _${doublePackets._id} duplicates, count: ${doublePackets.count}`, Constants.CONSOLE.FOUND);

        const packets = await MongoDb.find(ENUMS.DCB.USERS, { id: doublePackets._id });
        const indexOfMax = packets.reduce((maxIndex, obj, currentIndex) => {
            return obj.rawxp > packets[maxIndex].rawxp ? currentIndex : maxIndex;
        }, 0);

        if (indexOfMax !== -1) {
            packets.splice(indexOfMax, 1);
        }

        packets.forEach(async (packet) => {
            const filter = { _id: packet._id };
            await MongoDb.deleteOne(ENUMS.DCB.USERS, filter);
            console.log(`[MongoDb Check] removed _${packet._id} with Dc id: ${packet.id}`, Constants.CONSOLE.FOUND);
        });
    });
};

checkDuplicate();