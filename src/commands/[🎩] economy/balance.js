const Discord = require("discord.js");
const Getter = require("../../utils/Getter");
const constants = require("../../utils/constants");

module.exports = {
	name: "balance",
	aliases: ["bal", "money", "cash"],
	description: "Shows user balance",
	category: "[🎩] economy",
	usage: "[user]",
	run: async (client, message, args) => {
		const member =
			(await new Getter(message, args.join(" ")).getMember()) || message.member;

		const coins = client.coins.get(member.id) || { pocket: 0, bank: 0 };

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: `${member.user.username}'s balance`,
			})
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
			.setColor("#DA70D6")
			.setFooter({
				text: "https://patreon.com/kannacoco",
				iconURL: client.user.displayAvatarURL(),
			})
			.setDescription(
				`**Pocket:** ${
					constants.coins.emoji
				} ${coins.pocket.toLocaleString()}\n**Bank:** ${
					constants.coins.emoji
				} ${coins.bank.toLocaleString()}\n**Total:** ${
					constants.coins.emoji
				} ${(coins.pocket + coins.bank).toLocaleString()}`
			);

		message.reply({ embeds: [embed] });
	},
};
