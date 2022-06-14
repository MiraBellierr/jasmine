const Discord = require("discord.js");
const Getter = require("../../utils/Getter");
const Error = require("../../utils/Error");
const Util = require("../../utils/Util");

module.exports = {
	name: "poke",
	aliases: ["beep", "boop"],
	description: "poke someone",
	category: "[🤺] roleplay",
	usage: "<member>",
	run: async (client, message, args) => {
		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		const target = await new Getter(message, args.join(" ")).getMember();

		if (!target) return message.reply("I didn't found the user with this name");

		const url = await new Util().nekoapi(module.exports.name);

		if (target.id === message.author.id) {
			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: `${client.user.username} ${module.exports.name}s ${target.user.username}!`,
					iconURL: client.user.displayAvatarURL(),
				})
				.setImage(url)
				.setColor("#CD1C6C");

			return message.reply({ embeds: [embed] });
		}

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: `${message.author.username} ${module.exports.name}s ${target.user.username}`,
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setImage(url)
			.setColor("#CD1C6C");

		message.reply({ embeds: [embed] });
	},
};
