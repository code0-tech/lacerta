const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Embed, COLOR, replacePlaceHolders } = require("../models/Embed");
const TempEntryDB = require('../mongo/TempEntryDB');
const DcButtons = require("../singleton/DcButtons");
const Constants = require("../../data/constants");
const { guildById } = require("../singleton/DC");
const config = require('../../config.json');
const { Events } = require('discord.js');

const MAX_TIMERS = 1000;
const MAX_TIMER_WINDOW_MS = 1000 * 60 * 60 * 24 * Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS; // Only allow reminders within "Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS" days

let eventTimers = [];
let listenerIsSetup = false;

const fetchUpcomingEvents = async (guild) => {
    return await guild.scheduledEvents.fetch();
};

const runEventInfo = async (channelId, title, time, client, eventConfig, eventId, timer, timeInMinutes) => {
    console.log(`[PREREMINDER-EVENTS] Time remaining ${timeInMinutes} min for "${title}"`, Constants.CONSOLE.INFO);

    const placeholders = { title, minutesRemaining: timeInMinutes };

    const descriptionArray = (eventConfig.embed.descriptions[timeInMinutes] ?? eventConfig.embed.descriptions.default);
    const descriptionString = descriptionArray.at(Math.floor(Math.random() * descriptionArray.length));

    const embedMessage = new Embed()
        .setTitle(replacePlaceHolders(eventConfig.embed.title, placeholders))
        .setDescription(replacePlaceHolders(descriptionString, placeholders))
        .setColor(COLOR.INFO);

    if (eventConfig.embed.mention) {
        embedMessage.setContent(`<@&${config.server.roles[eventConfig.embed.mention]}>`);
    }

    if (eventConfig.invitationAcceptButtons) {
        const acceptInvite = new ButtonBuilder()
            .setCustomId(DcButtons.createString('eventPreReminderInviteButton', { acceptInvite: "1" }))
            .setLabel(eventConfig.invitationAcceptButtons.acceptText)
            .setStyle(ButtonStyle.Primary);

        const unAcceptInvite = new ButtonBuilder()
            .setCustomId(DcButtons.createString('eventPreReminderInviteButton', { acceptInvite: "0" }))
            .setLabel(eventConfig.invitationAcceptButtons.unAcceptText)
            .setStyle(ButtonStyle.Danger);

        embedMessage.setComponents([
            new ActionRowBuilder().addComponents(acceptInvite, unAcceptInvite)
        ])
    }

    eventTimers = eventTimers.filter(t => t.timer !== timer);

    const messageId = (await embedMessage.responseToChannel(channelId, client)).id;

    if (!eventConfig.invitationAcceptButtons) return;

    const tempEntry = await new TempEntryDB()
        .setIdentifiers('eventPreReminderInviteButtons', eventId)
        .restore();

    let tempEntryForEvent = tempEntry.getData();

    if (!tempEntryForEvent.messages) {
        tempEntryForEvent.messages = [];
        tempEntryForEvent.acceptedInvite = [];
        tempEntryForEvent.unAcceptedInvite = [];
        tempEntryForEvent.eventTitle = title;
    }

    tempEntryForEvent.messages.push(messageId);

    console.log(`[PREREMINDER-EVENTS] Event "${title}" contains inviteButtons, current added messages are ${tempEntryForEvent.messages.length}`, Constants.CONSOLE.INFO);

    tempEntry.setData(tempEntryForEvent)
        .setValidTimeInDays(1)
        .save();
};

const setupTimers = (channelId, title, time, client, eventConfig, eventId) => {
    eventConfig.reminderBeforeInMinutes.forEach(timeInMinutes => {
        const timeNew = time - (timeInMinutes * 1000 * 60);

        if (timeNew > 0 && timeNew < MAX_TIMER_WINDOW_MS) {
            if (eventTimers.length >= MAX_TIMERS) {
                console.log(`[PREREMINDER-EVENTS] Too many active timers (${eventTimers.length}), skipping timer for "${title}" at ${timeInMinutes} minutes`);
                return;
            }

            const timer = setTimeout(async () => {
                runEventInfo(channelId, title, time, client, eventConfig, eventId, timer, timeInMinutes);
            }, timeNew);

            eventTimers.push({ timer, title });

        } else {
            console.log(`[PREREMINDER-EVENTS] "${title}" invalid timeout: ${timeNew} ${timeNew > MAX_TIMER_WINDOW_MS ? `not within ${Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS} days` : ''}${timeNew < 0 ? 'timer is already in the past' : ''}, on call ${timeInMinutes} min before event`, Constants.CONSOLE.ERROR);
        }
    });
};

const deleteAllRunningTimers = () => {
    for (const { timer } of eventTimers) {
        clearTimeout(timer);
    }

    eventTimers = [];
    console.log(`[PREREMINDER-EVENTS] Cleared all existing timers`, Constants.CONSOLE.INFO);
};

const buildNewTimer = (client, event) => {
    const nextDateUnix = event.scheduledStartTimestamp;

    const dateInHumanFormat = new Date(nextDateUnix).toLocaleString();
    console.log(`[PREREMINDER-EVENTS] "${event.name}" next occurrence (Readable): ${dateInHumanFormat}`, Constants.CONSOLE.INFO);

    const timeUntilEvent = nextDateUnix - Date.now();

    const eventConfig = config.modules.eventPreReminder.find(cfg => cfg.title === event.name);

    if (!eventConfig) {
        console.log(`[PREREMINDER-EVENTS] No config found for "${event.name}", skipping...`, Constants.CONSOLE.INFO);
        return;
    }

    const eventMessageChannelId = config.server.channels[eventConfig.channelName];

    console.log(`[PREREMINDER-EVENTS] Config found for "${event.name}"`, Constants.CONSOLE.GOOD);
    setupTimers(eventMessageChannelId, event.name, timeUntilEvent, client, eventConfig, event.id);
}

const reBuildTimer = async (client, guild) => {
    deleteAllRunningTimers();

    const events = await fetchUpcomingEvents(guild);

    for (const event of events.values()) {
        buildNewTimer(client, event);
    }
};

const timerUpdate = (client, guild) => {
    console.log(`[PREREMINDER-EVENTS] Timer update, rebuilding all timers...`, Constants.CONSOLE.INFO);
    reBuildTimer(client, guild);
};

const setupEventListener = (client, guild) => {
    if (listenerIsSetup) return;
    listenerIsSetup = true;

    client.on(Events.GuildScheduledEventUpdate, () => {
        console.log(`[PREREMINDER-EVENTS] Event updated, rebuilding timers...`, Constants.CONSOLE.INFO);
        timerUpdate(client, guild);
    });

    client.on(Events.GuildScheduledEventDelete, () => {
        console.log(`[PREREMINDER-EVENTS] Event deleted, rebuilding timers...`, Constants.CONSOLE.INFO);
        timerUpdate(client, guild);
    });

    client.on(Events.GuildScheduledEventCreate, () => {
        console.log(`[PREREMINDER-EVENTS] Event created, rebuilding timers...`, Constants.CONSOLE.INFO);
        timerUpdate(client, guild);
    });
};

const setupEventMessages = async (client) => {
    const guild = await guildById(config.server.id, client);

    await reBuildTimer(client, guild);
    setupEventListener(client, guild);
};

module.exports = { setupEventMessages };