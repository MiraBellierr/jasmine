const log = require("node-pretty-log");
const {Signale} = require('signale');

const options = {
        disabled: false,
        interactive: false,
        logLevel: 'info',
        scope: 'custom',
        secrets: [],
        stream: process.stdout,
        types: {
          rocket: {
                badge: '🚀',
                color: 'red',
                label: 'rocket',
                logLevel: 'info'
          },
          loading: {
                badge: '↻',
                color: 'yellow',
                label: 'loading',
                logLevel: 'info'
          }
        }
  };

const custom = new Signale(options);

module.exports = async (client) => {
        const guilds = await client.guilds.fetch();

        client.user.setPresence({
                activities: [
                        {
                                name: `${guilds.size.toLocaleString()} servers ✨ | Ping me for an info about me!`,
                                type: "WATCHING",
                        },
                ],
                status: "idle",
        });

        console.log("=============================")
        custom.loading('Launching the bot [Connecting to discord servers...]');
        console.log("=============================")

        custom.rocket( `${client.user.username} is now launched!`);
};

