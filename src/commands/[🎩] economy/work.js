const schemas = require("../../database/schemas");
const economy = require("../../utils/economies");
const constants = require("../../utils/constants");
const words = [
	"I'm working for money.",
	"Today, I want to find a job.",
	"Time to go working!",
	"Let me take a break for a while",
	"Oh no, I'm late for work!",
	"Boss, I'm done.",
];

module.exports = {
	name: "work",
	description: "Work to earn coins",
	category: "[🎩] economy",
	run: async (client, message) => {
		const coins = await economy.getCoins(message.author);
		const timer = await economy.getCooldown(message.author, "work", 3.6e6);

		if (timer) {
			message.reply(
				`**${message.author.username}**, Please wait **${timer.minutes}m ${timer.seconds}s** before working again.`
			);
		} else {
			await schemas.timer().update(
				{
					work: Date.now(),
				},
				{ where: { userID: message.author.id } }
			);

			const word = words[Math.floor(Math.random() * words.length)];

			message.channel.send(
				`**${message.author.username}**\nRetype this following phrase:\n\`${word}\``
			);

			const input = await message.channel.awaitMessages({
				filter: (m) => m.author.id === message.author.id,
				max: 1,
				time: 30000,
			});

			if (!input.size) {
				return message.channel.send("Time is up! You lost the job.");
			}

			if (input.first().content.toLowerCase() === word.toLowerCase()) {
				const gain = Math.floor(Math.random() * 100);
				const current = coins.get("pocket");

				schemas.coins().update(
					{
						pocket: current + gain,
					},
					{ where: { userID: message.author.id } }
				);

				const amount = `${constants.coins.emoji} ${gain}`;

				message.reply(economy.getWork(amount));
			} else {
				message.channel.send("Poor effort. You lost the job.");
			}
		}
	},
};
