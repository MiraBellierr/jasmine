const schemas = require("../../database/schemas");
const economy = require("../../utils/economies");
const constants = require("../../utils/constants");

module.exports = {
	name: "crime",
	description: "Crime to earn coins",
	category: "[🎩] economy",
	run: async (client, message) => {
		const coins = await economy.getCoins(message.author);

		if (coins.get("pocket") < 50)
			return message.reply(
				"You need at least 50 coins in your pocket to do this!"
			);

		const timer = await economy.getCooldown(message.author, "crime", 6e4);

		if (timer)
			return message.reply(
				`**${message.author.username}**, Please wait **${timer.seconds}s** before you can do crime again.`
			);

		schemas.timer().update(
			{
				crime: Date.now(),
			},
			{ where: { userID: message.author.id } }
		);

		const success = Math.random < 0.5;

		if (success) {
			const pocket = coins.get("pocket");
			const gain = Math.ceil(Math.random() * pocket);

			schemas.coins().update(
				{
					pocket: pocket + gain,
				},
				{ where: { userID: message.author.id } }
			);

			const amount = `${constants.coins.emoji} ${gain}`;

			return message.reply(economy.getCrimeSuccess(amount));
		}

		const pocket = coins.get("pocket");
		const loss = Math.ceil(Math.random() * pocket);

		schemas.coins().update(
			{
				pocket: pocket - loss,
			},
			{ where: { userID: message.author.id } }
		);

		const amount = `${constants.coins.emoji} ${loss}`;

		return message.reply(economy.getCrimeFail(amount));
	},
};
