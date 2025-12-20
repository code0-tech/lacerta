const Constants = require('../../data/constants');

const setup = (client) => {

    if (!global.isDevelopment) return;

    client.on('debug', (message) => {
        if (message.includes(Constants.REGEX._SINGLE_STRING.DEBUG.SESSION_LIMIT)) {

            const match = message.match(Constants.REGEX.DEBUG.SESSION_LIMIT_INFORMATION);

            if (match) {
                const total = match[1];
                const remaining = match[2];

                console.log(`[Connection Limit] ${remaining}/${total}`, Constants.CONSOLE.INFO);
            }
        }

        if (message.includes(Constants.REGEX._SINGLE_STRING.DEBUG.LATENCY)) {

            const match = message.match(Constants.REGEX.DEBUG.API_LATENCY);

            if (match) {
                const latency = match[1];
                console.log(`[API] Latency: ${latency}ms`, Constants.CONSOLE.INFO);
            }
        }
    });
};

module.exports = { setup };