const schemas = require("../../database/schemas");
const Economy = require("../../utils/Economy");
const Error = require("../../utils/Error");
const constants = require("../../utils/constants");

module.exports = {
	name: "deposit",
	aliases: ["dep"],
	description: "Deposit your coins from a pocket to the bank",
	category: "[🎩] economy",
	usage: "<amount | all | max>",
	run: async (client, message, args) => {
		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		const coins = await new Economy(client).getCoins(message.author);
		const currentMaxDeposit = coins.get("maxDeposit");
		const currentBank = coins.get("bank");
		const currentPocket = coins.get("pocket");
		const currentSpace = currentMaxDeposit - currentBank;

		if (args[0] === "max" || args[0] === "all") {
			if (coins.get("pocket") < 1)
				return message.reply(
					`**${message.author.username}**, you don't have any coins from your pocket to be deposited.`
				);

			if (currentSpace > currentPocket) {
				schemas.coins().update(
					{
						pocket: 0,
						bank: currentBank + currentPocket,
					},
					{ where: { userID: message.author.id } }
				);

				message.reply(
					`**${message.author.username}**, you have deposited ${
						constants.coins.emoji
					} ${currentPocket.toLocaleString()} into the bank`
				);
			} else {
				schemas.coins().update(
					{
						pocket: currentPocket - currentSpace,
						bank: currentBank + currentSpace,
					},
					{ where: { userID: message.author.id } }
				);

				message.reply(
					`**${message.author.username}**, you have deposited ${
						constants.coins.emoji
					} ${currentSpace.toLocaleString()} into the bank`
				);
			}
		} else {
			if (isNaN(args[0]))
				return message.reply(
					`**${message.author.username}**, you have to deposit real amount of coins into the bank`
				);

			if (args[0] > currentSpace)
				return message.reply(
					`**${message.author.username}**, you don't have enough space in your bank for you to deposit that amount`
				);

			if (args[0] < 1)
				return message.reply(
					`**${message.author.username}**, you can deposit positive amount of coins only into the bank.`
				);

			if (currentPocket < args[0])
				return message.reply(
					`**${message.author.username}**, you don't have that much coins in your pocket`
				);

			const amount = parseInt(args[0]);

			schemas.coins().update(
				{
					pocket: currentPocket - amount,
					bank: currentBank + amount,
				},
				{ where: { userID: message.author.id } }
			);

			message.reply(
				`**${message.author.username}**, you have deposited ${
					constants.coins.emoji
				} ${amount.toLocaleString()} into the bank`
			);
		}
	},
};
