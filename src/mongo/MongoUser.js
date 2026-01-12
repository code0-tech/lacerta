const Constants = require('../../data/constants');
const { Mongo, ENUMS } = require('../models/Mongo');
const MongoDb = new Mongo();

class MongoUser {

    constructor() {
        this._userId = null;
    }

    /**
     * Load id for the user into the class.
     */
    async userById(userId) {
        this._userId = userId;
        await this._loadUser();

        return this;
    }

    /**
     * Create new User in Db if not present.
     */
    async _loadUser() {
        const userData = await MongoDb.find(ENUMS.DCB.USERS, { id: this._userId });

        if (userData[0] == undefined) {
            console.log('[MongoUser] User not found creating entries', Constants.CONSOLE.INFO);
            await this._createNewUser();
        }
    }

    /**
     * get User Packet
     */
    async _getUser() {
        const userData = await MongoDb.find(ENUMS.DCB.USERS, { id: this._userId });
        return userData[0];
    }

    /**
     * setup new User
     */
    async _createNewUser() {
        const userDocument = {
            id: this._userId,
            rawxp: 0,
            flags: {},
            stats: {
                messages: {
                    words: 0,
                    chars: 0,
                    count: 0
                },
                voice: {
                    _totalCalculated: 0, // totalValue for optimized database indexing/searching
                    activeTime: 0,
                    joinCount: 0,
                    channelSwitches: 0,
                    selfMuteTime: 0,
                    selfDeafTime: 0,
                    streamingTime: 0
                },
                invites: {
                    total: 0,
                    real: 0,
                    usersInvited: []
                }
            },
            commandUsage: {}
        };

        const mongoRes = await MongoDb.insertOne(ENUMS.DCB.USERS, userDocument);

        return mongoRes;
    }

    /**
     * get Global Xp position
     */
    async getXpGlobalPosition() {
        const user = await this._getUser();

        const input = [
            { $match: { rawxp: { $gt: user.rawxp } } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]

        const result = await MongoDb.aggregate(ENUMS.DCB.USERS, input);

        const position = result.length > 0 ? result[0].count + 1 : 1;

        return position;
    }

    /**
     * get Json
     */
    async getJson() {
        const user = await this._getUser();
        return user;
    }

    /**
     * get Level and Xp by raw Xp
     */
    async _getLvlAndXpByRawXp(rawXp) {

        const levelToXp = (x) => {
            return 30 * Math.pow(x, 2);
        }

        let level = -1;
        let requiredXP = 0;
        let previousLevelXP = 0;

        while (rawXp >= requiredXP) {
            level++;
            previousLevelXP = requiredXP;
            requiredXP = levelToXp(level);
        }

        return {
            level: level - 1, neededXp: requiredXP - previousLevelXP, xp: rawXp - previousLevelXP
        }
    }

    /**
     * update xp
     */
    async _updateXp(rawXp) {
        return await MongoDb.update(ENUMS.DCB.USERS, { id: this._userId }, { $set: { rawxp: rawXp } });
    }

    /**
     * update xp by number like i++ or i+= 1
     */
    async updateXpBy(incrementXp) {
        return await MongoDb.update(ENUMS.DCB.USERS, { id: this._userId }, { $inc: { ['rawxp']: incrementXp } });
    }

    /**
     * get user id
     */
    async getId() {
        return this._userId;
    }

    /**
     * get Rank
     */
    async getRank() {
        const user = await this._getUser();
        return await this._getLvlAndXpByRawXp(user.rawxp);
    }

    /**
     * returns all stats
     */
    async getStats() {
        const user = await this._getUser();
        return user.stats;
    }

    /**
     * returns all command stats
     */
    async getCommandUsage() {
        const user = await this._getUser();
        return user.commandUsage;
    }

    /**
     * update message stats
     */
    async updateMessageStats(count = 0, word = 0, chars = 0) {
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            {
                $inc: {
                    'stats.messages.count': count,
                    'stats.messages.words': word,
                    'stats.messages.chars': chars
                }
            }
        )
    }

    /**
     * update voice stats
     * @param {Object} stats - Object containing the increments
     */
    async updateVoiceStats({
        activeTime = 0,
        joins = 0,
        switches = 0,
        muteTime = 0,
        deafTime = 0,
        streamingTime = 0,
        _totalCalculated = 0
    } = {}) {

        // We calculate the new total increment to keep the indexed field updated

        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            {
                $inc: {
                    'stats.voice.activeTime': activeTime,
                    'stats.voice.joinCount': joins,
                    'stats.voice.channelSwitches': switches,
                    'stats.voice.selfMuteTime': muteTime,
                    'stats.voice.selfDeafTime': deafTime,
                    'stats.voice.streamingTime': streamingTime,
                    'stats.voice._totalCalculated': _totalCalculated
                }
            }
        );
    }

    /**
     * update command stats
     */
    async updateCommandUsage(name, handlerType, inc = 1) {
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            {
                $inc: {
                    [`commandUsage.${name}.${handlerType}`]: inc
                }
            }
        );
    }

    /**
     * Get the current invite stats (total, real, and list of IDs)
     */
    async getInviteStats() {
        const user = await this._getUser();
        return user.stats?.invites || { total: 0, real: 0, usersInvited: [] };
    }

    /**
     * Update total or real invites by amount
     */
    async updateInvitesBy(type, amount = 1) {
        if (!['total', 'real'].includes(type)) throw new Error("Type must be 'total' or 'real'");
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            { $inc: { [`stats.invites.${type}`]: amount } }
        );
    }

    /**
     * Save a member object to the invited list
     */
    async addInvitedMember(memberId) {
        const inviteObject = {
            id: memberId,
            time: Date.now()
        };

        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            { $push: { 'stats.invites.usersInvited': inviteObject } }
        );
    }

    /**
     * Remove a member by ID from the object array
     */
    async removeInvitedMember(memberId) {
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            { $pull: { 'stats.invites.usersInvited': { id: memberId } } }
        );
    }

    /**
     * Search for the original inviter by checking the 'id' field inside the objects
     */
    async findOriginalInviter(targetMemberId) {
        const results = await MongoDb.find(ENUMS.DCB.USERS, {
            'stats.invites.usersInvited.id': targetMemberId
        });
        return results[0] || null;
    }

    /**
     * Get a specific flag. 
     * Fallback: returns false if flags object or the specific flag doesn't exist.
     */
    async getFlag(flagName) {
        const user = await this._getUser();
        return user?.flags?.[flagName] ?? false;
    }

    /**
     * Set a flag to a specific value (usually true/false)
     */
    async setFlag(flagName, value) {
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            { $set: { [`flags.${flagName}`]: value } }
        );
    }

    /**
     * Completely remove a flag from the document
     */
    async removeFlag(flagName) {
        return await MongoDb.update(
            ENUMS.DCB.USERS,
            { id: this._userId },
            { $unset: { [`flags.${flagName}`]: "" } }
        );
    }
};

class MongoUserConsts {
    static get FLAGS() {
        return {
            INVITE_GIFT_RECEIVED: 'invitesGiftReceived',
            PRIVACY_SHOW_GLOBAL_STATS: 'privacyShowGlobalStats',
            REMOVED_DATA: 'removedData',
            EMOJI_INFO_FOR_MESSAGE_XP: 'emojiInfoForMessageXp'
        }
    }
    static get INVITES() {
        return {
            TYPES: {
                get REAL() {
                    return 'real';
                },
                get TOTAL() {
                    return 'total';
                }
            },
        }
    }
};

module.exports = { MongoUser, MongoUserConsts };