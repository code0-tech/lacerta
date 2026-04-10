const { CONSOLE } = require("../../data/constants");

class Mongo {
    constructor() {
        this.client = global.mongoClient;
    }

    async _getWhere(where) {
        const db = this.client.db(where.db);
        const col = db.collection(where.t);
        return col;
    }

    _shouldLog(where) {
        return where.t !== ENUMS.DCB.LOGS.t;
    }

    async renameField(where, oldName, newName) {
        try {
            const col = await this._getWhere(where);
            const result = await col.updateMany({}, { $rename: { [oldName]: newName } });
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Rename Field: ${oldName} -> ${newName} @${where.db}.${where.t}`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error(`Error renaming field:`, error);
            throw error;
        }
    }

    async unsetField(where, fieldPath) {
        try {
            const col = await this._getWhere(where);
            const result = await col.updateMany({}, { $unset: { [fieldPath]: "" } });
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Unset Field: ${fieldPath} @${where.db}.${where.t}`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error(`Error unsetting field:`, error);
            throw error;
        }
    }

    async setField(where, fieldPath, value) {
        try {
            const col = await this._getWhere(where);
            const result = await col.updateMany({}, { $set: { [fieldPath]: value } });
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Set Field: ${fieldPath} @${where.db}.${where.t}`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error(`Error setting field:`, error);
            throw error;
        }
    }

    async find(where, query = {}) {
        try {
            const col = await this._getWhere(where);
            const result = await col.find(query).toArray();
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Find: ${JSON.stringify(query)} @${where.db}.${where.t} (${result.length} results)`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error finding documents:', error);
            throw error;
        }
    }

    async findOne(where, query = {}) {
        try {
            const col = await this._getWhere(where);
            const result = await col.findOne(query);
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] FindOne: ${JSON.stringify(query)} @${where.db}.${where.t} (${result ? 'Found' : 'Not Found'})`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error findingOne document:', error);
            throw error;
        }
    }

    async aggregate(where, input) {
        try {
            const col = await this._getWhere(where);
            const result = await col.aggregate(input).toArray();
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Aggregate: ${input.length} stages @${where.db}.${where.t}`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error aggregate documents:', error);
            throw error;
        }
    }

    async distinct(where, field = '') {
        try {
            const col = await this._getWhere(where);
            const result = await col.distinct(field);
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Distinct: ${field} @${where.db}.${where.t}`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error distinct documents:', error);
            throw error;
        }
    }

    async insertOne(where, document) {
        try {
            const col = await this._getWhere(where);
            const result = await col.insertOne(document);
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] InsertOne @${where.db}.${where.t} (ID: ${result.insertedId})`, CONSOLE.GOOD);
            }
            return result.insertedId;
        } catch (error) {
            console.error('Error inserting document:', error);
            throw error;
        }
    }

    async update(where, query = {}, update = {}, options = {}) {
        try {
            const col = await this._getWhere(where);
            const result = await col.updateOne(query, update, options);
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] Update: ${JSON.stringify(query)} @${where.db}.${where.t} (Matched: ${result.matchedCount})`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteOne(where, query) {
        try {
            const col = await this._getWhere(where);
            const result = await col.deleteOne(query);
            if (this._shouldLog(where)) {
                console.log(`[MongoDB::Main] DeleteOne: ${JSON.stringify(query)} @${where.db}.${where.t} (Deleted: ${result.deletedCount})`, CONSOLE.GOOD);
            }
            return result;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
}

const dbDefaultName = "Code0";
const ENUMS = {
    DCB: {
        TEMP: { "db": dbDefaultName, "t": "temp" },
        USERS: { "db": dbDefaultName, "t": "users" },
        LOGS: { "db": dbDefaultName, "t": "logs" },
        CHANNELS: { "db": dbDefaultName, "t": "channels" },
        GITHUB_COMMITS: { "db": dbDefaultName, "t": "githubcommits" },
        AUTO_SLOWMO_CHANNELS: { "db": dbDefaultName, "t": "autoslowmochannels" }
    }
};

module.exports = { Mongo, ENUMS };