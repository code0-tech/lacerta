const { Embed, COLOR, progressBar } = require('./../models/Embed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MongoUser } = require('./../mongo/MongoUser');
const { waitMs } = require('./../utils/time');
const config = require('./../../config.json');
const DC = require('./../singleton/DC');


const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current rank.')
    .setDescriptionLocalizations({
        de: 'Zeig deinen aktuellen Rang.',
    })
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('View another user\'s rank.')
            .setDescriptionLocalizations({
                de: 'Zeigt den Rang eines anderen Benutzers an.',
            })
            .setRequired(false)
    );


const loop = async (interaction, member, Lang, embedMessage, rankMember, user, previousXp = null) => {
    const { level, neededXp, xp } = await user.getRank();
    const position = await user.getXpGlobalPosition();

    if (previousXp === null || xp !== previousXp) {
        const embed = new Embed()
            .setColor(COLOR.INFO)
            .setPbThumbnail(rankMember)
            .addLangContext(Lang.embed(embedMessage, {
                rankuserid: rankMember.id,
                level,
                neededXp,
                xp,
                progressbar: progressBar(xp, neededXp),
                position
            }))

        const response = await embed.interactionResponse(interaction);
        if (response == null) return;
    }

    if (embedMessage !== 'this-bot-rank' && config.commands.rank.upToDate15m) {
        await waitMs(config.commands.rank.updateMessageDelay);
        loop(interaction, member, Lang, embedMessage, rankMember, user, xp);
    }
};

const execute = async (dcInteraction) => {
    const { interaction, client, member, guild, Lang } = dcInteraction;

    await DC.defer(interaction);

    const userIdToCheck = interaction.options.getMember('user')?.user?.id ?? member.user.id;
    let embedMessage = userIdToCheck == member.user.id ? 'ownRank' : 'otherRank';

    if (client.user.id === userIdToCheck) {
        embedMessage = 'botRank';
    }

    const rankMember = await DC.memberById(userIdToCheck, guild);
    const user = await new MongoUser().userById(userIdToCheck);

    loop(interaction, member, Lang, embedMessage, rankMember, user);
};

module.exports = { execute, data };