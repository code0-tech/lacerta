const Constants = require('./../../data/constants');
const puppeteer = require('puppeteer');

const startPuppeteer = async () => {
    try {
        console.log('[Puppeteer] Starting Puppeteer...', Constants.CONSOLE.LOADING);

        global.renderPuppeteer = await puppeteer.launch({ headless: "new" });

        console.log('[Puppeteer] Puppeteer is online.', Constants.CONSOLE.INFO);
    } catch (error) {
        console.error('[Puppeteer] Error starting Puppeteer:', error.message);
        throw new Error('[Puppeteer] Failed to start Puppeteer. Exiting...');
    }
};

startPuppeteer();