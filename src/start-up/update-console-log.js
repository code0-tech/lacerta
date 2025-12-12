const { Mongo, ENUMS } = require('../models/Mongo');

let logDocument = null;
let logBuffer = [];

const generateRunId = () => {
    return Date.now();
};

const processNextLog = async () => {
    if (!logDocument && logBuffer.length > 0) {
        const MongoDb = new Mongo();
        const runId = generateRunId();
        logDocument = runId;

        process['dclogger'] = {
            runid: runId
        };

        const initialLogDocument = {
            "run_id": runId,
            "logs": [],
            "created_at": Date.now()
        };
        const result = await MongoDb.insertOne(ENUMS.DCB.LOGS, initialLogDocument);
    }

    if (logDocument && logBuffer.length > 0) {
        const log = logBuffer.shift();
        const MongoDb = new Mongo();
        await MongoDb.update(
            ENUMS.DCB.LOGS,
            { "run_id": logDocument },
            { $push: { "logs": log } }
        );
    }
};

setInterval(processNextLog, 500);

const logToMongoDb = async (log) => {
    if (global.mongoClient == null) return;

    const logData = {
        "msg": log instanceof Error ? log.message : log,
        "error": log instanceof Error ? log.stack : null,
        "time": Date.now()
    };

    logBuffer.push(logData);
};

const originalConsoleLog = console.log;
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m', // Good 1
    yellow: '\x1b[33m', // Doing 2
    red: '\x1b[31m', // Error 3

    blue: '\x1b[34m', // Loading 4
    magenta: '\x1b[35m', // Info 5
    cyan: '\x1b[36m', // Found or got 6

    bgGreen: '\x1b[42m'
};

const customLog = (...args) => {
    let color = colors.reset;

    if (args.length > 1) {
        const colorCode = args.pop();
        const index = parseInt(colorCode.replace('#', ''));

        const colorKeys = Object.keys(colors);
        if (index >= 1 && index <= colorKeys.length - 1) {
            color = colors[colorKeys[index]];
        }
    }

    const log = args.join(' ');

    if (!global.isDevelopment) {
        logToMongoDb(log);
    } else {
        process['dclogger'] = {
            runid: 999999999
        };
    }

    const coloredLog = `${color}${log}${colors.reset}`;

    originalConsoleLog(coloredLog);
};

console.log = customLog;