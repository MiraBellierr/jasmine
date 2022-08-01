const schemas = require("../../database/schemas");
const error = require("../../utils/errors");

module.exports = {
	name: "setname",
	description: "Sets your name",
	usage: "setname <name>",
	category: "[👹] rpg",
	run: async (client, message, args) => {
		const character = await schemas.character().findOne({
			where: { userID: message.author.id },
		});

		if (!character)
			return message.reply(
				`You haven't register yet! Use \`${client.prefixes.get(
					message.guild.id
				)}register <class>\` to register!`
			);

		if (args.length < 1)
			return error.argsError(module.exports, client, message);

		const name = args.join(" ");

		if (name.length > 256) return message.reply("Your name is too long!");

		schemas.character().update(
			{
				name,
			},
			{ where: { userID: message.author.id } }
		);

		message.reply(`Your name has been set to ${name}!`);
	},
};
