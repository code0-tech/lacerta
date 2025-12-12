const Constants = require('./../../data/constants');

const quit = () => {
    console.log('Exiting gracefully...', Constants.CONSOLE.WORKING);
    process.exit(0);
};

process.on('SIGINT', quit);
process.on('SIGQUIT', quit);
process.on('SIGTERM', quit);