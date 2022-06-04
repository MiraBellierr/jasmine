const { Signale } = require("signale");
const constants = require("../../utils/constants");

const custom = new Signale(constants.options.ready);

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

	console.log("=============================");
	custom.loading("Launching the bot [Connecting to discord servers...]");
	console.log("=============================");

	custom.rocket(`${client.user.username} is now launched!`);
};
