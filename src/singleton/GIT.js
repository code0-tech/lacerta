const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const Chart = require('../models/Chart');

const MongoDb = new Mongo();

class GIT_SETTINGS {
    static USERS(userArray) {
        return { userArray };
    }
    static REPOS(reponameArray) {
        return { reponameArray };
    }
    static DAILY_PACKETS(boolean = true) {
        return { dailyPackets: boolean };
    }
    static LONG_PACKETS(boolean = true) { // this is done because the GIT getter return type might change
        return { dailyPackets: !boolean }
    }
    static SET_START(startUnix) {
        return { startUnix };
    }
    static SET_END(endUnix) {
        return { endUnix };
    }
    static BRANCHES(branchnameArray) {
        return { branchnameArray }
    }
};

class GIT_AFTER_SORT {
    static longPacketsToCommitSumPerRepo = (data) => {
        return data.reduce((acc, entry) => {
            acc[entry.repo] = (acc[entry.repo] || 0) + entry.commitscount;
            return acc;
        }, {});
    }

    static longPacketsToUserSumPerRepo = (data) => {
        return Object.values(
            data.reduce((acc, { name, commitscount }) => {
                acc[name] = acc[name] || { name, commitscount: 0 };
                acc[name].commitscount += commitscount;
                return acc;
            }, {})
        );
    }
};

class GIT {
    static _transformArrayToObject(arr) {
        if (!Array.isArray(arr)) {
            return {};
        }

        const result = {};

        arr.forEach(item => {
            Object.keys(item).forEach(key => {
                result[key] = item[key];
            });
        });

        return result;
    }

    static get DEFAULT_TIMES() {
        return {
            get start() {
                return 0;
            },
            get end() {
                return 99999999999999999999;
            }
        }
    }

    static async _requestMongoDb(pipeline) {
        return await MongoDb.aggregate(ENUMS.DCB.GITHUB_COMMITS, pipeline);
    }

    static async timeStartAndEnd(settings = []) {
        const options = this._transformArrayToObject(settings);

        const matchConditions = {
            time: {
                $gte: options.startUnix ?? this.DEFAULT_TIMES.start,
                $lt: options.endUnix ?? this.DEFAULT_TIMES.end
            }
        };

        const pipeline = [
            { $match: matchConditions },
            {
                $group: {
                    _id: null,
                    minTime: { $min: "$time" },
                    maxTime: { $max: "$time" }
                }
            },
            {
                $project: {
                    _id: 0,
                    startDate: {
                        $dateToString: { format: "%d-%m-%Y", date: { $toDate: "$minTime" } }
                    },
                    endDate: {
                        $dateToString: { format: "%d-%m-%Y", date: { $toDate: "$maxTime" } }
                    }
                }
            }
        ];

        const result = await this._requestMongoDb(pipeline);

        return result.length > 0 ? result[0] : { startDate: null, endDate: null };
    }

    static async getAllUniqueNames(settings = []) {
        const options = this._transformArrayToObject(settings);

        const matchConditions = {
            time: {
                $gte: options.startUnix ?? this.DEFAULT_TIMES.start,
                $lt: options.endUnix ?? this.DEFAULT_TIMES.end
            }
        };

        if (options.userArray && options.userArray.length > 0) {
            matchConditions.name = { $in: options.userArray };
        }

        const pipeline = [
            { $match: matchConditions },
            { $group: { _id: "$name" } },
            { $project: { _id: 0, name: "$_id" } }
        ];

        const result = await this._requestMongoDb(pipeline);

        return result.map(item => item.name);
    }

    static async getAllRepos(settings = []) {
        const options = this._transformArrayToObject(settings);

        const matchConditions = {
            time: {
                $gte: options.startUnix ?? this.DEFAULT_TIMES.start,
                $lt: options.endUnix ?? this.DEFAULT_TIMES.end
            }
        };

        if (options.userArray && options.userArray.length > 0) {
            matchConditions.name = { $in: options.userArray };
        }

        const pipeline = [
            { $match: matchConditions },
            { $group: { _id: "$repo" } },
            { $project: { _id: 0, repo: "$_id" } }
        ];

        const result = await this._requestMongoDb(pipeline);

        return result.map(item => item.repo);
    }

    static async simpleSort(settings = []) {
        const options = this._transformArrayToObject(settings);

        const matchConditions = {
            time: {
                $gte: options.startUnix ?? this.DEFAULT_TIMES.start,
                $lt: options.endUnix ?? this.DEFAULT_TIMES.end
            }
        };

        if (options.userArray && options.userArray.length > 0) {
            matchConditions.name = { $in: options.userArray };
        }

        if (options.reponameArray && options.reponameArray.length > 0) {
            matchConditions.repo = { $in: options.reponameArray };
        }

        if (options.branchnameArray && options.branchnameArray.length > 0) {
            matchConditions.branchname = { $in: options.branchnameArray };
        }

        const pipeline = [
            { $match: matchConditions },
            { $sort: { time: 1 } }
        ]

        if (options.dailyPackets) {
            pipeline.push(
                {
                    $group: {
                        _id: {
                            name: "$name",
                            date: {
                                $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$time" } }
                            }
                        },
                        dailyCommits: { $sum: "$commitscount" },
                        branchnames: { $addToSet: "$branchname" },
                        reponames: { $addToSet: "$repo" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id.name",
                        date: "$_id.date",
                        dailyCommits: 1,
                        branchnames: 1,
                        reponames: 1
                    }
                }
            )
        } else {
            pipeline.push({ $match: matchConditions },
                { $sort: { time: 1 } })
        }

        return await this._requestMongoDb(pipeline);
    }
};

module.exports = { GIT, GIT_SETTINGS, GIT_AFTER_SORT };