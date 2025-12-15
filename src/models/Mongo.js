class Mongo {
    constructor() {
        this.client = global.mongoClient;
    }

    async _getWhere(where) {
        const db = this.client.db(where.db);
        const col = db.collection(where.t);
        return col;
    }

    async find(where, query = {}) {
        try {
            const col = await this._getWhere(where);
            const result = await col.find(query).toArray();
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
            return result;
        } catch (error) {
            console.error('Error finding document:', error);
            throw error;
        }
    }

    async aggregate(where, input) {
        try {
            const col = await this._getWhere(where);
            const result = await col.aggregate(input).toArray();
            return result;
        } catch (error) {
            console.error('Error aggregate documents:', error);
            throw error;
        }
    }

    async distinct(where, string = '') {
        try {
            const col = await this._getWhere(where);
            const result = await col.distinct(string);
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
            return result.insertedId;
        } catch (error) {
            console.error('Error inserting document:', error);
            throw error;
        }
    }

    async update(where, query = {}, update = {}) {
        try {
            const col = await this._getWhere(where);
            const result = await col.updateOne(query, update);
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
            return result;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
};

const ENUMS = {
    DCB: {
        USERS: { "db": "Code0", "t": "users" },
        LOGS: { "db": "Code0", "t": "logs" },
        GITHUB_COMMITS: { "db": "Code0", "t": "githubcommits" },
        AUTO_SLOWMO_CHANNELS: { "db": "Code0", "t": "autoslowmochannels" }
    }
};

module.exports = { Mongo, ENUMS };