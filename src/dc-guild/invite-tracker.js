const { MongoUser, MongoUserConsts } = require('../mongo/MongoUser');
const Constants = require('../../data/constants');
const config = require('./../../config.json');
const { Collection } = require('discord.js');
const DC = require('../singleton/DC');

const inviteCache = new Collection();

const checkForInvitesGift = async (inviterMongo, inviterId, invitedId, client) => {
    if ((await inviterMongo.getInviteStats()).real < config.functions.invites.actions.gift.realInvites) return;

    if (await inviterMongo.getFlag(MongoUserConsts.FLAGS.INVITE_GIFT_RECEIVED) == true) return;

    const member = await DC.codeZeroMemberById(inviterId, client);

    DC.memberAddRoleId(member, config.functions.invites.actions.gift.roleId);

    inviterMongo.setFlag(MongoUserConsts.FLAGS.INVITE_GIFT_RECEIVED, true);

    console.log(`[INVITE-TRACKER] Member ${inviterId} was gifted "INVITE_GIFT".`, Constants.CONSOLE.GOOD);
};

const checkForAction = (inviterMongo, inviterId, invitedId, client) => {
    checkForInvitesGift(inviterMongo, inviterId, invitedId, client);
};

const saveUserIfValidInvite = async (inviterId, invitedId, client) => {
    try {
        const inviter = new MongoUser(inviterId);
        await inviter.init();

        const existingInviterDoc = await inviter.findOriginalInviter(invitedId);

        if (existingInviterDoc) {
            console.log(`[INVITE-TRACKER] Member ${invitedId} rejoined. Already credited to ${existingInviterDoc.id}.`, Constants.CONSOLE.INFO);

            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.TOTAL, 1);
        } else {
            console.log(`[INVITE-TRACKER] Crediting ${inviterId} for inviting ${invitedId}.`, Constants.CONSOLE.INFO);

            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.TOTAL, 1);
            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.REAL, 1);
            await inviter.addInvitedMember(invitedId);
        }

        checkForAction(inviter, inviterId, invitedId, client);
    } catch (err) {
        console.log(`[INVITE-TRACKER] Error in saveUserIfValidInvite`, Constants.CONSOLE.ERROR);
    }
};

const start = async (client) => {
    console.log(`[INVITE-TRACKER] Starting...`, Constants.CONSOLE.GOOD);

    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const invites = await guild.invites.fetch();
            inviteCache.set(guildId, new Collection(invites.map(i => [i.code, i.uses])));
        } catch (err) {
            console.log(`[INVITE-TRACKER] ${member.user.tag} Could not cache invites for guild ${guildId}.`, Constants.CONSOLE.ERROR);
        }
    }

    client.on('guildMemberAdd', async (member) => {
        const { guild } = member;

        try {
            const newInvites = await guild.invites.fetch();
            const oldInvites = inviteCache.get(guild.id);

            const usedInvite = newInvites.find(i => i.uses > (oldInvites?.get(i.code) || 0));

            inviteCache.set(guild.id, new Collection(newInvites.map(i => [i.code, i.uses])));

            if (usedInvite) {
                const inviter = usedInvite.inviter;
                console.log(`[INVITE-TRACKER] ${member.user.tag} joined using code ${usedInvite.code} from ${inviter.id} ${inviter?.tag || 'Unknown'}`, Constants.CONSOLE.WORKING);

                saveUserIfValidInvite(inviter.id, member.id, client);
            } else {
                console.log(`[INVITE-TRACKER] ${member.user.tag} joined, but no invite match found (Vanity URL or OAuth2 likely).`, Constants.CONSOLE.ERROR);
            }
        } catch (e) {
            console.log(`[INVITE-TRACKER] ${member.user.tag} Error handling guildMemberAdd invite tracking.`, Constants.CONSOLE.ERROR);
        }
    });

    client.on('inviteCreate', (invite) => {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) guildInvites.set(invite.code, invite.uses);
    });

    client.on('inviteDelete', (invite) => {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) guildInvites.delete(invite.code);
    });
};

module.exports = { start };