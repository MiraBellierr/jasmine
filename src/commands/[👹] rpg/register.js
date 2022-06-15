const classes = require("../../database/json/classes.json");
const Error = require("../../utils/Error");
const schemas = require("../../database/schemas");
const Discord = require("discord.js");

module.exports = {
	name: "register",
	description: "Register the profile",
	category: "[👹] rpg",
	usage: "<class>",
	run: async (client, message, args) => {
		if (!args.length || !Object.keys(classes).includes(args[0].toLowerCase())) {
			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL({ dynamic: true }),
				})
				.setDescription(
					`To begin play, please choose one of these class with the \`${client.prefixes.get(
						message.guild.id
					)}register <class>\``
				)
				.setTimestamp()
				.setColor("#CD1C6C");

			Object.keys(classes).forEach((c) => {
				embed.addField(
					`${c.charAt(0).toUpperCase() + c.slice(1)}`,
					`\`\`\`js\n• Level: 1\n• HP: ${classes[c].hp}\n• STR: ${classes[c].str}\n• AGL: ${classes[c].agl}\n\`\`\``
				);
			});

			return message.reply({ embeds: [embed] });
		}

		try {
			const character = client.characters.random();
			const chaClass = classes[args[0].toLowerCase()];

			await schemas.character().create({
				userID: message.author.id,
				name: character.name,
				class: args[0].toLowerCase(),
				level: 1,
				hp: chaClass.hp,
				str: chaClass.str,
				agl: chaClass.agl,
				img: character.image,
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
};
