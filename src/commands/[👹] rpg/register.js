const classes = require("../../database/json/classes.json");
const { argsError } = require("../../utils/errors");
const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const characterImage = require("../../database/json/img.json");

module.exports = {
	name: "register",
	description: "Register the profile",
	category: "[👹] rpg",
	usage: "<class>",
	run: async (client, message, args) => {
		if (!args.length || !Object.keys(classes).includes(args[0].toLowerCase())) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL(),
				})
				.setDescription(
					`To begin play, please choose one of these class with the \`${client.prefixes.get(
						message.guild.id
					)}register <class>\``
				)
				.setTimestamp()
				.setColor("#CD1C6C");

			Object.keys(classes).forEach((c) => {
				embed.addFields([
					{
						name: `${c.charAt(0).toUpperCase() + c.slice(1)}`,
						value: `\`\`\`js\n• Level: 1\n• HP: ${classes[c].hp}\n• STR: ${classes[c].str}\n• AGL: ${classes[c].agl}\n• ATT: ${classes[c].att}\n• DEF: ${classes[c].def}\n\`\`\``,
					},
				]);
			});

			return message.reply({ embeds: [embed] });
		}

		try {
			const chaClass = classes[args[0].toLowerCase()];
			const img = characterImage[args[0].toLowerCase()];

			await schemas.character().create({
				userID: message.author.id,
				name: message.author.username,
				class: args[0].toLowerCase(),
				level: 1,
				img,
				equipments: JSON.stringify({
					weapons: {
						equipped: "",
						inventory: [],
					},
					shields: {
						equipped: "",
						inventory: [],
					},
					helmet: {
						equipped: "",
						inventory: [],
					},
					armor: {
						equipped: "",
						inventory: [],
					},
					gloves: {
						equipped: "",
						inventory: [],
					},
				}),
				...chaClass,
			});

			message.reply(
				`You have successfully registered! Type \`${client.prefixes.get(
					message.guild.id
				)}profile\` to see your profile.`
			);
		} catch {
			message.reply(
				`Sorry, you have already registered! Type \`${client.prefixes.get(
					message.guild.id
				)}profile\` to see your profile.`
			);
		}
	},
	interaction: {
		data: {
			name: "register",
			description: "Register the profile",
			type: 1,
			options: [
				{
					name: "class",
					description: "choose a class",
					type: 3,
					required: true,
					choices: [
						{
							name: "Warrior",
							value: "warrior",
						},
						{
							name: "Mage",
							value: "mage",
						},
						{
							name: "Monk",
							value: "monk",
						},
					],
				},
			],
		},
		run: async (client, interaction) => {
			const prompt = interaction.options.getString("class");

			try {
				const chaClass = classes[prompt];
				const img = characterImage[prompt];

				await schemas.character().create({
					userID: interaction.user.id,
					name: interaction.user.username,
					class: prompt,
					level: 1,
					img,
					equipments: JSON.stringify({
						weapons: {
							equipped: "",
							inventory: [],
						},
						shields: {
							equipped: "",
							inventory: [],
						},
						helmet: {
							equipped: "",
							inventory: [],
						},
						armor: {
							equipped: "",
							inventory: [],
						},
						gloves: {
							equipped: "",
							inventory: [],
						},
					}),
					...chaClass,
				});

				interaction.reply(
					`You have successfully registered! Type \`/profile\` to see your profile.`
				);
			} catch {
				interaction.reply(
					`Sorry, you have already registered! Type \`/profile\` to see your profile.`
				);
			}
		},
	},
};
