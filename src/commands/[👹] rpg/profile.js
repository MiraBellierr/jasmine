const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");

module.exports = {
	name: "profile",
	aliases: ["pf"],
	description: "Shows RPG profile",
	category: "[👹] rpg",
	usage: "<member>",
	run: async (client, message, args) => {
		const member =
			(await getMemberFromArguments(message, args.join(" "))) || message.member;

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

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: `${member.user.username}'s profile`,
				iconURL: member.user.displayAvatarURL({ dynamic: true }),
			})
			.setColor("#CD1C6C")
			.setTitle(`Level ${character.get("level")} ${character.get("name")}`)
			.addFields([
				{
					name: "__Stats__",
					value: `**• <:class:880658124246237254> Class:** ${character.get(
						"class"
					)}\n**• <:xp:880655736261206036> XP:** ${character.get(
						"xp"
					)}/${character.get(
						"xpNeeded"
					)}\n**• <:health:880655864523014155> HP:** ${character.get(
						"hp"
					)}\n**• <:pa:880665943959797811> STR:** ${character.get(
						"str"
					)}\n**• <:speed:880668456066891826> AGL:** ${character.get("agl")}`,
				},
			])
			.setImage(character.get("img"))
			.setTimestamp()
			.setFooter({
				text: "https://patreon.com/kannacoco",
				iconURL: client.user.displayAvatarURL(),
			});

		message.reply({ embeds: [embed] });
	},
};
