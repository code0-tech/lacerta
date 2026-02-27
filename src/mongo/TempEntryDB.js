const { Mongo, ENUMS } = require('../models/Mongo');
const MongoDb = new Mongo();

class TempEntryDB {
    constructor() {
        this.identifier = null;
        this.identifierAddition = null;
        this.validUntil = Date.now();
        this.data = {};
        this._shouldIncrement = false;
    }

    _refreshClient() {
        if (!MongoDb.client && global.mongoClient) {
            MongoDb.client = global.mongoClient;
        }
    }

    setIdentifiers(mainIdentifier = null, addition = null) {
        this.identifier = mainIdentifier;
        this.identifierAddition = addition;
        return this;
    }

    useAutoIncrement() {
        this._shouldIncrement = true;
        return this;
    }

    getData() {
        return this.data;
    }

    setData(newData = {}) {
        this.data = newData;
        return this;
    }

    setValidTimeTo1Hour() {
        this.validUntil = Date.now() + (1000 * 60 * 60 * 1);
        return this;
    }

    setValidTimeTo30Days() {
        this.validUntil = Date.now() + (1000 * 60 * 60 * 24 * 30);
        return this;
    }

    setValidTimeInSeconds(seconds = 1) {
        this.validUntil = Date.now() + (1000 * seconds);
        return this;
    }

    setValidTimeInMinutes(minutes = 1) {
        this.validUntil = Date.now() + (1000 * 60 * minutes);
        return this;
    }

    setValidTimeInHours(hours = 1) {
        this.validUntil = Date.now() + (1000 * 60 * 60 * hours);
        return this;
    }

    setValidTimeInDays(days = 1) {
        this.validUntil = Date.now() + (1000 * 60 * 60 * 24 * days);
        return this;
    }

    async _performIncrement() {
        this._refreshClient();
        if (!this.identifier) throw new Error("Main identifier must be set first.");

        const existingEntries = await MongoDb.find(ENUMS.DCB.TEMP, {
            identifier: this.identifier
        });

        let maxNumber = -1;
        for (const entry of existingEntries) {
            const val = entry.identifierAddition;
            if (val !== null && val !== undefined && !isNaN(val) && typeof val !== 'boolean') {
                const num = parseInt(val);
                if (num > maxNumber) maxNumber = num;
            }
        }

        this.identifierAddition = maxNumber + 1;
        this._shouldIncrement = false;
    }

    async save() {
        this._refreshClient();

        if (this._shouldIncrement) {
            await this._performIncrement();
        }

        const query = {
            identifier: this.identifier,
            identifierAddition: this.identifierAddition
        };

        const update = {
            $set: {
                data: this.data,
                validUntil: this.validUntil
            }
        };

        return await MongoDb.update(ENUMS.DCB.TEMP, query, update, { upsert: true });
    }

    /**
     * @param {string} path - The internal path inside the data object (e.g., "messages")
     * @param {any} value - The value to look for inside that array
     */
    async restoreFromFilterByArray(path, value) {
        this._refreshClient();

        const query = {
            identifier: this.identifier,
            [`data.${path}`]: value
        };
        console.dir(query);

        const results = await MongoDb.find(ENUMS.DCB.TEMP, query);
        console.dir(results);

        if (results && results[0]) {
            const doc = results[0];
            this.identifierAddition = doc.identifierAddition;
            this.data = doc.data;
            this.validUntil = doc.validUntil;
            return this;
        }
        return this;
    }

    async restore() {
        this._refreshClient();
        const results = await MongoDb.find(ENUMS.DCB.TEMP, {
            identifier: this.identifier,
            identifierAddition: this.identifierAddition
        });

        if (results && results[0]) {
            this.data = results[0].data;
            this.validUntil = results[0].validUntil;
            return this;
        }
        return this;
    }
}

module.exports = TempEntryDB;