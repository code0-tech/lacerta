const { MongoClient, ServerApiVersion } = require('mongodb');
const Constants = require('./../../data/constants');

const mongoClient = new MongoClient(process.env.MONGO_URL, {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    // socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const connect = async () => {
    try {
        await mongoClient.connect();
        console.log('[MongoDb] Connected to MongoDB', Constants.CONSOLE.GOOD);

        mongoClient.on('error', (err) => {
            console.log(`[MongoDb] Connection lost!: ${err}`, Constants.CONSOLE.ERROR);
        });

    } catch (err) {
        console.error('[MongoDb] Fatal Error during initial connect:', err);
        process.exit(1);
    }
};

global.mongoClient = mongoClient;
module.exports = { connect };