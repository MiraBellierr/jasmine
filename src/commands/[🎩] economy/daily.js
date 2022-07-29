const schemas = require("../../database/schemas");
const economies = require("../../utils/economies");
const constants = require("../../utils/constants");

module.exports = {
	name: "daily",
	description: "Daily to earn coins",
	category: "[🎩] economy",
	run: async (client, message) => {
		const coins = await economies.getCoins(message.author);
		const timer = await economies.getCooldown(message.author, "daily", 864e5);

		if (timer)
			return message.reply(
				`**${message.author.username}**, Please wait **${timer.hours}h ${timer.seconds}s** before you can claim your daily again.`
			);

		schemas.timer().update(
			{
				daily: Date.now(),
			},
			{ where: { userID: message.author.id } }
		);

		schemas.coins().update(
			{
				pocket: coins.get("pocket") + 100,
			},
			{ where: { userID: message.author.id } }
		);

		const amount = `${constants.coins.emoji} 100`;

		return message.reply(`You claimed your daily and got ${amount}!`);
	},
};
