const { REST, Routes } = require('discord.js');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

let commands = [];

const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'commands')).filter(file => file.endsWith('.js'));

commandFiles.forEach(file => {
    const command = require(path.join(__dirname, '..', 'src', 'commands', file));
    if (command.data && command.data !== null) { // no command data aka "_"-command.
        commands.push(command.data.toJSON());
        console.log(`Register: ${command.data.name}`);
    }
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands })
    .then(() => {
        console.log("Registered all Commands!")
    })
    .catch(console.error)