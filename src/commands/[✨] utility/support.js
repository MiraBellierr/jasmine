module.exports = {
	name: "support",
	description: "Jasmine bot support Discord server",
	category: "[✨] utility",
	run: async (client, message) => {
		message.reply("Our support server:\nhttps://discord.gg/NcPeGuNEdc");
	},
	interaction: {
		data: {
			name: "support",
			type: 1,
			description: "Jasmine bot support Discord server",
		},
		run: async (client, interaction) => {
			interaction.reply("Our support server:\nhttps://discord.gg/NcPeGuNEdc");
		},
	},
};
