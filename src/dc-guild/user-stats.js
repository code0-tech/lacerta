const { MongoUser } = require('../mongo/MongoUser');

const saveMessageStats = async (msg, count, words, chars) => {
    const user = await new MongoUser(msg.author.id).init();

    user.updateMessageStats(count, words, chars);
};

const start = (client) => {
    client.on('messageCreate', async msg => {

        if (msg.author.bot == true) return;
        if (msg.author.system == true) return;

        const count = 1;
        const words = msg.content.split(" ").length;
        const chars = msg.content.length;

        saveMessageStats(msg, count, words, chars);
    })
};

module.exports = { start };