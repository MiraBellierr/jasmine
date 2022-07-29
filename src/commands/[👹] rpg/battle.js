const Battle = require("../../utils/rpg");

module.exports = {
	name: "battle",
	aliases: ["bt"],
	description: "Battle with another user",
	category: "[👹] rpg",
	usage: "[member]",
	run: async (client, message, args) => {
		new Battle(message, message.author).startRandom();
	},
};
