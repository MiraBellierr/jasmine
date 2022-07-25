const schemas = require("../../database/schemas");
const economy = require("../../utils/economies");
const constants = require("../../utils/constants");

module.exports = {
	name: "beg",
	description: "Beg someone to give you money.",
	category: "[🎩] economy",
	run: async (client, message, args) => {
		const coins = await economy.getCoins(message.author);
		const timer = await economy.getCooldown(message.author, "beg", 4e4);

		if (timer)
			return message.reply(
				`**${message.author.username}**, Please wait **${timer.seconds}s** before begging again.`
			);

		await schemas.timer().update(
			{
				beg: Date.now(),
			},
			{
				where: { userID: message.author.id },
			}
		);

		const success = Math.random() < 0.7;

		if (success) {
			const gain = Math.floor(Math.random() * 50) + 3;
			const current = coins.get("pocket");

			schemas.coins().update(
				{
					pocket: current + gain,
				},
				{ where: { userID: message.author.id } }
			);

			const amount = `${constants.coins.emoji} ${gain}`;

			return message.reply(`You begged and got ${amount}!`);
		}

		return message.reply("You begged and got nothing.");
	},
};
