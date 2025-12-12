const checkState = async (oldState, newState) => {
    let userId = newState.member ? newState.member.id : oldState.member.id;
    let newUserChannel = newState.channel;
    let oldUserChannel = oldState.channel;

    if (oldUserChannel === null && newUserChannel !== null) {
        return {
            state: 'JOIN',
            userId,
            newChannel: newUserChannel,
            oldChannel: oldUserChannel
        };
    } else if (oldUserChannel !== null && newUserChannel === null) {
        return {
            state: 'LEAVE',
            userId,
            newChannel: newUserChannel,
            oldChannel: oldUserChannel
        };
    } else if (
        oldUserChannel !== null &&
        newUserChannel !== null &&
        oldUserChannel.id != newUserChannel.id
    ) {
        return {
            state: 'SWITCH',
            userId,
            newChannel: newUserChannel,
            oldChannel: oldUserChannel
        };
    } else {
        return {
            state: 'NO_CHANGE',
            userId,
            newChannel: newUserChannel,
            oldChannel: oldUserChannel

        };
    }
};

const userVoiceState = async (userId, guild) => {
    return guild.voiceStates.cache.get(userId);
};

module.exports = { checkState, userVoiceState };