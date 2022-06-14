const Discord = require("discord.js");
const { getUserFromArguments } = require("../../utils/getters");
const constants = require("../../utils/constants");
const Economy = require("../../utils/Economy");

module.exports = {
	name: "balance",
	aliases: ["bal", "money", "cash"],
	description: "Shows user balance",
	category: "[🎩] economy",
	usage: "[user]",
	run: async (client, message, args) => {
		const user =
			(await getUserFromArguments(message, args.join())) || message.author;

		const coins = await new Economy(client).getCoins(user);

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: `${user.username}'s balance`,
			})
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setColor("#DA70D6")
			.setFooter({
				text: "https://patreon.com/kannacoco",
				iconURL: client.user.displayAvatarURL(),
			})
			.setDescription(
				`**Pocket:** ${constants.coins.emoji} ${coins
					.get("pocket")
					.toLocaleString()}\n**Bank:** ${constants.coins.emoji} ${coins
						.get("bank")
						.toLocaleString()}/${coins
							.get("maxDeposit")
							.toLocaleString()}\n**Total:** ${constants.coins.emoji} ${(
								coins.get("pocket") + coins.get("bank")
							).toLocaleString()}`
			);

		message.reply({ embeds: [embed] });
	},
};
