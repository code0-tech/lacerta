const Constants = require('./../../data/constants');
const { Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');

const load = (client) => {
    const commandPath = path.join(global.mainDir, 'src', 'commands');
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

    client.commands = new Collection();
    client.components = new Collection();

    for (const commandFile of commandFiles) {
        const command = require(path.join(commandPath, commandFile));
        const commandName = commandFile.split(".")[0];

        command.fileName = commandName;

        // Load Slash-Command
        if (command.data) {
            client.commands.set(command.data.name, command);
            console.log(`[InteractionLoader::SlashCommand] Loaded command: ${command.data.name}`, Constants.CONSOLE.LOADING);
        } else {
            command.data = { name: commandName };
        }

        // Load Components
        if (command.executeComponent && command.componentIds) {
            if (command.componentIds.length == 0) {
                console.log(`[InteractionLoader::Components] Tip: Remove unused componentIds array for: ${command.data.name}`, Constants.CONSOLE.LOADING);
            }
            for (const buttonId of command.componentIds) {
                client.components.set(buttonId, command);
            }
            console.log(`[InteractionLoader::Components] Loaded component: ${command.componentIds.length ? command.componentIds : '[]'} for: ${command.data.name}`, Constants.CONSOLE.LOADING);
        }

        // Run autoRun functions
        if (command.autoRun) {
            command.autoRun(client, client.languages);
            console.log(`[InteractionLoader::AutoRun] Run autoRun() function for ${commandFile}`, Constants.CONSOLE.LOADING);
        }
    }

    // Setup the emitter
    require('./emit-interactions').setup(client);
};

module.exports = { load };