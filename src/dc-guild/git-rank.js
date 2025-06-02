const GITCOMMITSTOTAL = require('../singleton/GITCOMMITSTOTAL');
const { Mongo, ENUMS } = require('../models/Mongo');
const { Embed, COLOR } = require('../models/Embed');
const Constants = require('../../data/constants');
const config = require('../../config.json');
const schedule = require('node-schedule');

const MongoDb = new Mongo();

const medals = [
    Constants.DISCORD.EMOJIS.FIRSTPLACE,
    Constants.DISCORD.EMOJIS.SECONDPLACE,
    Constants.DISCORD.EMOJIS.THIRDPLACE
];

const totalDays = async () => {
    const currentDate = new Date();
    const currentTimestamp = currentDate.getTime();
    const adjustedTimestamp = currentTimestamp - (Constants.GIT.START_DAYS_BACK_FROM_TODAY * Constants.TIME_MULTIPLIER_MS.DAY);
    const adjustedDate = new Date(adjustedTimestamp);

    const result = await MongoDb.aggregate(ENUMS.DCB.GITHUB_COMMITS, [
        {
            $match: {
                time: { $gte: adjustedDate.getTime() }
            }
        },
        {
            $group: {
                _id: null,
                minTime: { $min: '$time' }
            }
        }
    ])

    const time = result.length > 0 ? result[0].minTime : null;

    const now = Date.now();
    const differenceInMillis = now - time;
    const days = Math.floor(differenceInMillis / Constants.TIME_MULTIPLIER_MS.DAY);
    return `${days + 1}`;
}

const fetchGitCommits = async (spanStartDate, spanEndDate) => {
    const query = {
        time: {
            $gte: spanStartDate,
            $lte: spanEndDate
        }
    };

    return await MongoDb.find(ENUMS.DCB.GITHUB_COMMITS, query);
}

const calculateUserStats = (documents) => {
    return documents.reduce((acc, doc) => {
        const { name, repo, branchname, commitscount } = doc;
        if (!acc[name]) {
            acc[name] = { total: 0, repos: {} };
        }
        acc[name].total += commitscount;
        if (!acc[name].repos[repo]) {
            acc[name].repos[repo] = new Set();
        }
        acc[name].repos[repo].add(branchname);
        return acc;
    }, {});
}

const formatUserStats = (userStats) => {
    return Object.entries(userStats).map(([name, { total, repos }]) => ({
        name,
        total,
        repos: Object.entries(repos).map(([repo, branches]) => ({
            repo,
            branches: Array.from(branches)
        }))
    })).sort((a, b) => b.total - a.total);
}

const buildLeaderboardDescription = async (formattedUserStats) => {

    if (!formattedUserStats[0]) {
        return `### No Winner Today.\nNo commits in the last 24 hours.`;
    }

    let description = `
### ${Constants.DISCORD.EMOJIS.TROPHY} Winner: ${formattedUserStats[0].name} ${Constants.DISCORD.EMOJIS.TROPHY}

The winner made ${formattedUserStats[0].total} commits in the past 24 hours.
### Commits Leaderboard\n`;

    formattedUserStats.forEach((user, index) => {
        const medal = medals[index] || `${index + 1}.`;
        description += `${medal} ${user.name}: \`${user.total} commits\`\n`;
    });

    return description;
}

const createEmbedMessage = async (description) => {
    return new Embed()
        .setColor(COLOR.INFO)
        .setDescription(description)
        .setAttachment(await GITCOMMITSTOTAL.getAttachment())
        .setFooter(`Stats over the last ${await totalDays()} days.`)
        .setImage(Constants.DISCORD.EMBED_IMAGE_NAME.EMBED.DEFAULT_PNG_01);
}

const sendGitRankMessage = async (client) => {
    const spanEndDate = Date.now();
    const spanStartDate = spanEndDate - Constants.TIME_MULTIPLIER_MS.DAY;

    const documents = await fetchGitCommits(spanStartDate, spanEndDate);
    const userStats = calculateUserStats(documents);
    const formattedUserStats = formatUserStats(userStats);
    const names = formattedUserStats.map(packet => packet.name);
    const description = await buildLeaderboardDescription(formattedUserStats);
    const embed = await createEmbedMessage(description);

    if (client == null) {
        return embed; // for debug command
    }

    embed.responseToChannel(config.channels.gitranks, client);

    console.log(`[Git-ranks] sent message to channel.`, Constants.CONSOLE.WORKING);
}

const setup = (client) => {
    const job = schedule.scheduleJob(Constants.GIT.GRAPH.SCHEDULE, function () {
        sendGitRankMessage(client);
    });
}


module.exports = { setup, sendGitRankMessage };