const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const Getter = require("../../utils/Getter");

module.exports = {
	name: "profile",
	aliases: ["pf"],
	description: "Shows RPG profile",
	category: "[👹] rpg",
	usage: "<member>",
	run: async (client, message, args) => {
		const member =
			(await new Getter(message, args.join(" ")).getMember()) || message.member;

		if (!member)
			return message.reply("I didn't found that member in this server.");

		const character = await schemas
			.character()
			.findOne({ where: { userID: member.id } });

		if (!character)
			return message.reply(
				`A user with a username ${
					member.user.username
				} is not register yet. Please type \`${client.prefixes.get(
					message.guild.id
				)}register <class>\` to register`
			);

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: `${member.user.username}'s profile`,
				iconURL: member.user.displayAvatarURL({ dynamic: true }),
			})
			.setColor("#CD1C6C")
			.setTitle(character.get("name"))
			.setDescription(
				`\`\`\`js\n• Level: ${character.get("level")}\n• HP: ${character.get(
					"hp"
				)}\n• STR: ${character.get("str")}\n• AGL: ${character.get(
					"agl"
				)}\n\`\`\``
			)
			.setImage(character.get("img"))
			.setTimestamp()
			.setFooter({
				text: "https://patreon.com/kannacoco",
				iconURL: client.user.displayAvatarURL(),
			});

		message.reply({ embeds: [embed] });
	},
};
