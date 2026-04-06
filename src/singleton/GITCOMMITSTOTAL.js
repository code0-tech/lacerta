const { getNextDayByDateString } = require('../utils/time');
const { getColorByString } = require('../utils/color');
const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const Chart = require('../models/Chart');

const MongoDb = new Mongo();

class GITCOMMITSTOTAL {
    static getCommitsMongo = async () => {
        const currentDate = new Date();
        const currentTimestamp = currentDate.getTime();
        const adjustedTimestamp = currentTimestamp - (Constants.GIT.START_DAYS_BACK_FROM_TODAY * Constants.TIME_MULTIPLIER_MS.DAY);
        const adjustedDate = new Date(adjustedTimestamp);

        const pipeline = [
            {
                $match: {
                    time: { $gte: adjustedDate.getTime() }
                }
            },
            {
                $sort: { time: 1 }
            },
            {
                $group: {
                    _id: {
                        name: "$name",
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$time" } }
                        }
                    },
                    dailyCommits: { $sum: "$commitscount" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ];

        const dbData = await MongoDb.aggregate(ENUMS.DCB.GITHUB_COMMITS, pipeline);

        return dbData;
    }

    static formatGitData = async (dbData) => {
        if (!dbData || dbData.length === 0) {
            return { datasets: [], labels: [] };
        }

        const firstDate = dbData[0]._id.date;
        const lastDate = new Date().toISOString().slice(0, 10);
        const labels = [];

        for (let d = firstDate; d <= lastDate; d = getNextDayByDateString(d)) {
            labels.push(d);
        }

        const userRawData = new Map();
        dbData.forEach(entry => {
            const { name, date } = entry._id;
            if (!userRawData.has(name)) {
                userRawData.set(name, new Map());
            }
            userRawData.get(name).set(date, entry.dailyCommits);
        });

        const datasets = [];

        for (const [name, dateMap] of userRawData.entries()) {
            const dataPoints = [];
            let runningTotal = 0;
            let userLifetimeTotal = 0;

            for (const date of labels) {
                const dayCommits = dateMap.get(date) || 0;
                runningTotal += dayCommits;
                userLifetimeTotal += dayCommits;
                dataPoints.push(runningTotal);
            }

            datasets.push({
                label: `${name} [${userLifetimeTotal}]`,
                data: dataPoints,
                borderColor: getColorByString(name, Constants.SEEDS.GITCHART),
                fill: false,
                _totalCommits: userLifetimeTotal
            });
        }

        return { datasets, labels };
    }

    static makeChartByDataset = (datasets, labels) => {
        const chart = new Chart(Constants.GIT.GRAPH.SIZEX, Constants.GIT.GRAPH.SIZEY)
            .setType('line')
            .setLabels(labels);

        datasets.sort((a, b) => b._totalCommits - a._totalCommits);

        datasets.forEach(dataset => {
            chart.addDataset(dataset.label, dataset.data, dataset.borderColor);
        });

        return chart;
    }

    static getAttachment = async () => {
        const dbData = await this.getCommitsMongo();
        const { datasets, labels } = await this.formatGitData(dbData);
        const chart = this.makeChartByDataset(datasets, labels);
        return await chart.getAttachment();
    }
};

module.exports = GITCOMMITSTOTAL;