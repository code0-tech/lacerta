const Constants = require('./../../data/constants');
const { MongoClient } = require('mongodb');

const mongoClient = new MongoClient(process.env.MONGO_URL);

const connect = async () => {
    mongoClient.connect()
        .then(() => {
            console.log('[MongoDb] Connected to MongoDB', Constants.CONSOLE.GOOD);
            return true;
        })
        .catch((err) => {
            console.error('[MongoDb] Error connecting to MongoDB:', err);
            process.exit(1);
        });
};

global.mongoClient = mongoClient;

module.exports = { connect };