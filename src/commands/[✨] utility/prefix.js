const schemas = require("../../database/schemas");
const Error = require("../../utils/Error");

module.exports = {
	name: "prefix",
	description: "change a prefix for your server",
	category: "[✨] utility",
	usage: "<new prefix>",
	run: async (client, message, args) => {
		if (!message.member.permissions.has("MANAGE_GUILD"))
			return message.reply(
				`**${message.author.username}**, Sorry you don't have manage server permission to use this command.`
			);

		const Guilds = await schemas.guild();

		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		if (message.mentions.size > 0)
			return new Error(module.exports, client, message).argsError();

		try {
			await Guilds.create({
				guildID: message.guild.id,
				prefix: args.join(" "),
			});
		} catch {
			await Guilds.update(
				{ prefix: args.join(" ") },
				{ where: { guildID: message.guild.id } }
			);
		}

		client.prefixes.set(message.guild.id, args.join(" "));

		message.channel.send(
			`Prefix for this server has been changed to **${client.prefixes.get(
				message.guild.id
			)}**!`
		);
	},
};
