const Constants = require('../../data/constants');

const setup = (client) => {

    if (!global.isDevelopment) return;

    client.on('debug', (message) => {
        if (message.includes('Remaining')) {

            const match = message.match(Constants.REGEX.DEBUG.SESSION_LIMIT_INFORMATION);

            if (match) {
                const total = match[1];
                const remaining = match[2];

                console.log(`[Connection Limit] ${remaining}/${total}`, Constants.CONSOLE.INFO);
            }
        }

        if (message.includes('Heartbeat acknowledged')) {

            const match = message.match(Constants.REGEX.DEBUG.API_LATENCY);

            if (match) {
                const latency = match[1];
                console.log(`[API] Latency: ${latency}ms`, Constants.CONSOLE.INFO);
            }
        }
    });
}


module.exports = { setup };