const Discord = require("discord.js");
const utils = require("../../utils/utils");

module.exports = {
	category: "[🤺] Roleplay",
	interaction: {
		data: {
			name: "roleplay",
			description: "roleplay",
			type: 1,
			options: [
				{
					name: "bite",
					description: "bite someone",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "blush",
					description: "blush",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "clap",
					description: "clap",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "cuddle",
					description: "cuddle",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "cry",
					description: "cry",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "dance",
					description: "dance",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "facepalm",
					description: "facepalm",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "glare",
					description: "glare",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "hug",
					description: "hug",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "kill",
					description: "kill",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "kiss",
					description: "kiss",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "laugh",
					description: "laugh",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "pat",
					description: "pat",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "poke",
					description: "poke",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "punch",
					description: "punch",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "shoot",
					description: "shoot",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "slap",
					description: "slap",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
				{
					name: "smile",
					description: "smile",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
						},
					],
				},
				{
					name: "tickle",
					description: "tickle",
					type: 1,
					options: [
						{
							name: "member",
							description: "member",
							type: 6,
							required: true,
						},
					],
				},
			],
		},
		run: async (client, interaction) => {
			const action = interaction.options.getSubcommand();
			const pp = {
				bite: "bites",
				blush: "blushes",
				clap: "claps",
				cry: "cries",
				cuddle: "cuddles",
				dance: "dances",
				facepalm: "facepalms",
				glare: "glares",
				hug: "hugs",
				kill: "kills",
				kiss: "kisses",
				laugh: "laughs",
				pat: "pats",
				poke: "pokes",
				punch: "punches",
				shoot: "shoots",
				slap: "slaps",
				smile: "smiles",
				tickle: "tickles",
			};

			const actionPp = pp[action];
			const member = interaction.options.getMember("member");
			const url = await utils.nekoapi(action);

			if (!member) {
				const embed = new Discord.EmbedBuilder()
					.setAuthor({
						name: `${interaction.user.username} ${actionPp}!`,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setImage(url)
					.setColor("#CD1C6C");

				return interaction.reply({ embeds: [embed] });
			}

			if (member.id === interaction.user.id) {
				const embed = new Discord.EmbedBuilder()
					.setAuthor({
						name: `${client.user.username} ${actionPp} on ${member.user.username}!`,
						iconURL: client.user.displayAvatarURL(),
					})
					.setImage(url)
					.setColor("#CD1C6C");

				return interaction.reply({ embeds: [embed] });
			}

			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: `${interaction.user.username} ${actionPp} on ${member.user.username}`,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setImage(url)
				.setColor("#CD1C6C");

			interaction.reply({ embeds: [embed] });
		},
	},
};
