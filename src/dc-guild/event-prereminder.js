const { Embed, COLOR, replacePlaceHolders } = require("../models/Embed");
const Constants = require("../../data/constants");
const { guildById } = require("../singleton/DC");
const config = require('../../config.json');
const { Events } = require('discord.js');

const MAX_TIMERS = 1000;
const MAX_TIMER_WINDOW_MS = 1000 * 60 * 60 * 24 * Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS; // Only allow reminders within "Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS" days

let eventTimers = [];
let listenerSetup = false;

const fetchUpcomingEvents = async (guild) => {
    return await guild.scheduledEvents.fetch();
}

const setupTimer = (channelId, title, time, client, eventConfig) => {
    eventConfig.reminderbeforeinminutes.forEach(timeInMinutes => {
        const timeNew = time - (timeInMinutes * 1000 * 60);

        if (timeNew > 0 && timeNew < MAX_TIMER_WINDOW_MS) {
            if (eventTimers.length >= MAX_TIMERS) {
                console.log(`[PREREMINDER-EVENTS] Too many active timers (${eventTimers.length}), skipping timer for "${title}" at ${timeInMinutes} minutes`);
                return;
            }

            const timer = setTimeout(() => {
                console.log(`[PREREMINDER-EVENTS] Time remaining ${timeInMinutes} min for "${title}"`, Constants.CONSOLE.INFO);

                const placeholders = { title, minutesRemaining: timeInMinutes };

                const embedMessage = new Embed()
                    .setTitle(replacePlaceHolders(eventConfig.embed.title, placeholders))
                    .setContent(`<@&${config.roles[eventConfig.embed.mention]}>`)
                    .setDescription(replacePlaceHolders(eventConfig.embed.description, placeholders))
                    .setColor(COLOR.INFO);

                embedMessage.responseToChannel(channelId, client);

                eventTimers = eventTimers.filter(t => t.timer !== timer);
            }, timeNew);

            eventTimers.push({ timer, title });

        } else {
            console.log(`[PREREMINDER-EVENTS] "${title}" invalid timeout: ${timeNew} ${timeNew > MAX_TIMER_WINDOW_MS ? `not within ${Constants.SETTINGS.PREREMINDER_EVENTS.MAX_TIMER_WINDOW_DAYS} days` : ''}${timeNew < 0 ? 'timer is already in the past' : ''}, on call ${timeInMinutes} min before event`, Constants.CONSOLE.ERROR);
        }
    });
}

const deleteAllRunningTimers = () => {
    for (const { timer } of eventTimers) {
        clearTimeout(timer);
    }
    eventTimers = [];
    console.log(`[PREREMINDER-EVENTS] Cleared all existing timers`, Constants.CONSOLE.INFO);
}

const buildTimer = async (client, guild) => {
    deleteAllRunningTimers();

    const events = await fetchUpcomingEvents(guild);

    for (const event of events.values()) {
        const nextDateUnix = event.scheduledStartTimestamp;
        const readableDate = new Date(nextDateUnix).toLocaleString();

        console.log(`[PREREMINDER-EVENTS] "${event.name}" next occurrence (Readable): ${readableDate}`, Constants.CONSOLE.INFO);

        const timeRemaining = nextDateUnix - Date.now();

        const eventConfig = config.commands.eventprereminder.find(cfg => cfg.title === event.name);

        if (eventConfig) {
            const channelId = config.channels[eventConfig.channelname];

            console.log(`[PREREMINDER-EVENTS] Config found for "${event.name}"`, Constants.CONSOLE.GOOD);
            setupTimer(channelId, event.name, timeRemaining, client, eventConfig);
        } else {
            console.log(`[PREREMINDER-EVENTS] No config found for "${event.name}", skipping...`, Constants.CONSOLE.INFO);
        }
    }
}

const timerUpdate = (client, guild) => {
    console.log(`[PREREMINDER-EVENTS] Timer update, rebuilding all timers...`, Constants.CONSOLE.INFO);
    buildTimer(client, guild);
}

const setupChangeEventListener = (client, guild) => {
    if (listenerSetup) return;
    listenerSetup = true;

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
}

const setupEventMessages = async (client) => {
    const guild = await guildById(config.serverid, client);

    await buildTimer(client, guild);
    setupChangeEventListener(client, guild);
}


module.exports = { setupEventMessages };