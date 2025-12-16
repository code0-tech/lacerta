const Constants = require('../../data/constants');
const { Collection } = require('discord.js');
const { MongoUser, MongoUserConsts } = require('../mongo/MongoUser');

const inviteCache = new Collection();

const saveUserIfValidInvite = async (inviterId, invitedId) => {
    try {
        const inviter = new MongoUser(inviterId);
        await inviter.init();

        const existingInviterDoc = await inviter.findOriginalInviter(invitedId);

        if (existingInviterDoc) {
            console.log(`[INVITE-TRACKER] Member ${invitedId} joined again. Already credited to ${existingInviterDoc.id}. Only incrementing Total.`, Constants.CONSOLE.INFO);

            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.TOTAL, 1);
        } else {
            console.log(`[INVITE-TRACKER] New unique join! Crediting ${inviterId} for inviting ${invitedId}.`, Constants.CONSOLE.INFO);

            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.TOTAL, 1);
            await inviter.updateInvitesBy(MongoUserConsts.INVITES.TYPES.REAL, 1);
            await inviter.addInvitedMember(invitedId);
        }
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

                saveUserIfValidInvite(inviter.id, member.id);
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