const { Signale } = require("signale");
const constants = require("../../utils/constants");
const Discord = require("discord.js");

const custom = new Signale(constants.options.ready);

module.exports = async (client) => {
	const guilds = await client.guilds.fetch();

	client.user.setPresence({
		activities: [
			{
				name: "with you because you are fun to play with ^-^",
			},
		],
		status: Discord.PresenceUpdateStatus.Idle,
	});

	console.log("=============================");
	custom.loading("Launching the bot [Connecting to discord servers...]");
	console.log("=============================");

	custom.rocket(`${client.user.username} is now launched!`);
};
