const { Mongo, ENUMS } = require('../models/Mongo');
const Constants = require('../../data/constants');
const config = require('../../config.json');
const { Events } = require('discord.js');

const MongoDb = new Mongo();

const handleGitHubCommitMessage = async (client, msg) => {
    try {
        if (msg.webhookId !== config.github.dcwebhookid) return;

        const embedData = msg.embeds[0]?.data;
        if (!embedData) return;

        const regexCommitCount = /\d+(?= new commit| new commits)/;
        const matches = embedData.title.match(regexCommitCount);
        if (!matches) return;

        if (config.commands.gitrank.users.blacklist.includes(embedData.author.name) || embedData.author.name.endsWith(config.commands.gitrank.users.blacklisttag)) {
            console.log(`[Webhook Commit Filter] wont save commits for blacklist user: ${embedData.author.name}.`, Constants.CONSOLE.WORKING);
            return;
        }

        const regexRepoInfo = /\[(.*?):(.*?)\]/;
        const githubInfo = regexRepoInfo.exec(embedData.title);
        if (!githubInfo || githubInfo.length < 3) return;

        const repo = githubInfo[1];
        const branchName = githubInfo[2];

        const commitCount = parseInt(matches[0]);

        const doc = {
            name: embedData.author.name,
            id: null,
            repo,
            branchname: branchName,
            commitscount: commitCount,
            time: Date.now()
        };

        await MongoDb.insertOne(ENUMS.DCB.GITHUB_COMMITS, doc);

        console.log(`[Webhook Commit Filter] got ${commitCount} commits for ${embedData.author.name}.`, Constants.CONSOLE.WORKING);
    } catch (error) {
        console.error('Error handling GitHub commit message:', error);
    }
};

const start = (client) => {
    client.on(Events.MessageCreate, async (msg) => {
        await handleGitHubCommitMessage(client, msg);
    });
};


module.exports = { start };