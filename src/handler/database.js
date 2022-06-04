const schemas = require("../database/schemas");
const Ascii = require("ascii-table");
const table = new Ascii("Database");
const constants = require("../utils/constants");
const signale = require("signale");

table.setHeading("Schema", "Status");

const custom = new signale.Signale(constants.options.handler);

module.exports = async (client) => {
	const Guilds = await schemas.guild().findAll();
	const WelcomeMessages = await schemas.welcomeMessage().findAll();
	const LeaveMessages = await schemas.leaveMessage().findAll();
	const Starboards = await schemas.starboard().findAll();

	if (Guilds.length) {
		Guilds.forEach((guild) =>
			client.prefixes.set(guild.dataValues.guildID, guild.dataValues.prefix)
		);
	}

	if (WelcomeMessages.length) {
		WelcomeMessages.forEach((welcomeMessage) =>
			client.welcomes.set(
				welcomeMessage.dataValues.guildID,
				welcomeMessage.dataValues
			)
		);
	}

	if (LeaveMessages.length) {
		LeaveMessages.forEach((leaveMessage) =>
			client.leaves.set(
				leaveMessage.dataValues.guildID,
				leaveMessage.dataValues
			)
		);
	}

	if (Starboards.length) {
		Starboards.forEach((starboard) =>
			client.starboards.set(starboard.dataValues.guildID, starboard.dataValues)
		);
	}

	Object.keys(schemas).forEach((schema) => {
		schemas[schema]();

		table.addRow(schema, "✅");
	});

	console.log("=============================");
	signale.watch(`Loading DB`);
	custom.loading("\n" + table.toString());
};
