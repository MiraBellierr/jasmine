const log = require("node-pretty-log");

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

	log("info", `${client.user.username} is ready!`);
};
