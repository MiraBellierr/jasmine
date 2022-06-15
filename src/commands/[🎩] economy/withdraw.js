const schemas = require("../../database/schemas");
const economy = require("../../utils/economies");
const { argsError } = require("../../utils/errors");
const constants = require("../../utils/constants");

module.exports = {
	name: "withdraw",
	aliases: ["with"],
	description: "Withdraw your coins from a bank to your pocket",
	category: "[🎩] economy",
	usage: "<amount | all | max>",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		const coins = await economy.getCoins(message.author);
		const currentMaxDeposit = coins.get("maxDeposit");
		const currentBank = coins.get("bank");
		const currentPocket = coins.get("pocket");
		const currentSpace = currentMaxDeposit - currentBank;

		if (args[0] === "max" || args[0] === "all") {
			if (currentBank < 1)
				return message.reply(
					`**${message.author.username}**, you don't have any coins in your bank to be withdrew`
				);

			schemas.coins().update(
				{
					pocket: currentPocket + currentBank,
					bank: 0,
				},
				{ where: { userID: message.author.id } }
			);

			message.reply(
				`**${message.author.username}**, you have withdrew ${
					constants.coins.emoji
				} ${currentBank.toLocaleString()} from your bank`
			);
		} else {
			if (isNaN(args[0]))
				return message.reply(
					`**${message.author.username}**, you have to withdraw a real amount of coins from your bank`
				);

			if (args[0] < 1)
				return message.reply(
					`**${message.author.username}**, you have to withdraw positive amount of coins only from your bank`
				);

			if (currentBank < args[0])
				return message.reply(
					`**${message.author.username}**, you dont have that much coins in your bank to be withdrew`
				);

			const amount = parseInt(args[0]);

			schemas.coins().update(
				{
					pocket: currentPocket + amount,
					bank: currentBank - amount,
				},
				{ where: { userID: message.author.id } }
			);

			message.reply(
				`**${message.author.username}**, you have withdrew ${
					constants.coins.emoji
				} ${amount.toLocaleString()} from your bank`
			);
		}
	},
};
