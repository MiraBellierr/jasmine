const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const utils = require("../../utils/utils");

module.exports = {
	name: "tickle",
	description: "tickle someone",
	category: "[🤺] roleplay",
	usage: "<member>",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		const target = await getMemberFromArguments(message, args.join(" "));

		if (!target) return message.reply("I didn't found the user with this name");

		const url = await utils.nekoapi(module.exports.name);

		if (target.id === message.author.id) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: `${client.user.username} ${module.exports.name}s ${target.user.username}!`,
					iconURL: client.user.displayAvatarURL(),
				})
				.setImage(url)
				.setColor("#CD1C6C");

			return message.reply({ embeds: [embed] });
		}

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: `${message.author.username} ${module.exports.name}s ${target.user.username}`,
				iconURL: message.author.displayAvatarURL(),
			})
			.setImage(url)
			.setColor("#CD1C6C");

		message.reply({ embeds: [embed] });
	},
};
