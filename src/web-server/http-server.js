const Constants = require('./../../data/constants');
const httpConfig = require('./../../http-config.json');
const http = require('http');
const path = require('path');
const url = require('url');
const fs = require('fs');

module.exports.setup = (client) => {
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);

        if (parsedUrl.pathname.startsWith(httpConfig.oauth.basepath)) {
            const provider = parsedUrl.pathname.replace(httpConfig.oauth.basepath, '');

            const callbackHandlerPath = path.join(__dirname, 'oauth-callback', `${provider}.js`);

            if (fs.existsSync(callbackHandlerPath)) {
                const callbackHandler = require(callbackHandlerPath);
                callbackHandler(req, res, client);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`Callback handler for ${provider} not found.`);
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    server.listen(httpConfig.port, () => {
        console.log(`[Git Http Server] Http Server => http://*:${httpConfig.port}`, Constants.CONSOLE.GOOD);
    });
};