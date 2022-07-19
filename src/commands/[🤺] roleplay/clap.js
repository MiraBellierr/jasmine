const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const utils = require("../../utils/utils");

module.exports = {
	name: "clap",
	description: "applause someone",
	category: "[🤺] roleplay",
	run: async (client, message, args) => {
		const url = await utils.nekoapi(module.exports.name);

		if (!args.length) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: `${message.author.username} is ${module.exports.name}ping!`,
					iconURL: message.author.displayAvatarURL(),
				})
				.setImage(url)
				.setColor("#CD1C6C");

			return message.reply({ embeds: [embed] });
		}

		const target = await getMemberFromArguments(message, args.join(" "));

		if (!target) return message.reply("I didn't found the user with this name");

		if (target.id === message.author.id) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: `${client.user.username} applauses ${target.user.username}!`,
					iconURL: client.user.displayAvatarURL(),
				})
				.setImage(url)
				.setColor("#CD1C6C");

			return message.reply({ embeds: [embed] });
		}

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: `${message.author.username} applauses ${target.user.username}`,
				iconURL: message.author.displayAvatarURL(),
			})
			.setImage(url)
			.setColor("#CD1C6C");

		message.reply({ embeds: [embed] });
	},
};
