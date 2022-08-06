const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const constants = require("../../utils/constants");

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

		const equipments = JSON.parse(character.get("equipments"));

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: `${member.user.username}'s profile`,
				iconURL: member.user.displayAvatarURL(),
			})
			.setColor("#CD1C6C")
			.setTitle(`Level ${character.get("level")} ${character.get("name")}`)
			.addFields([
				{
					name: "__Stats__",
					value: `**• ${constants.assets.class.emoji} Class:** ${
						character.get("class").charAt(0).toUpperCase() +
						character.get("class").slice(1)
					}\n**• ${constants.assets.xp.emoji} XP:** ${character.get(
						"xp"
					)}/${character.get("xpNeeded")}\n**• ${
						constants.assets.hp.emoji
					} HP:** ${character.get("hp")}\n**• ${
						constants.assets.str.emoji
					} STR:** ${character.get("str")}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${character.get("agl")}\n**• ${
						constants.assets.sta.emoji
					} STA:** ${character.get("sta")}\n**• ${
						constants.assets.acc.emoji
					} ACC:** ${character.get("acc")}\n**• ${
						constants.assets.eva.emoji
					} EVA:** ${character.get("eva")}\n**• ${
						constants.assets.att.emoji
					} ATT:** ${character.get("att")}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${character.get("def")}`,
					inline: true,
				},
				{
					name: "__Equipments__",
					value: `**• ${constants.assets.weapon.emoji} Weapon:** ${
						equipments.weapons.equipped
							? equipments.weapons.equipped
									.replace(/([A-Z])/g, " $1")
									.toLowerCase()
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")
							: "None"
					}\n**• ${constants.assets.shield.emoji} Shield:** ${
						equipments.shields.equipped
							? equipments.shields.equipped
									.replace(/([A-Z])/g, " $1")
									.toLowerCase()
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")
							: "None"
					}\n**• ${constants.assets.helmet.emoji} Helmet:** ${
						equipments.helmet.equipped
							? equipments.helmet.equipped
									.replace(/([A-Z])/g, " $1")
									.toLowerCase()
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")
							: "None"
					}\n**• ${constants.assets.armor.emoji} Armor:** ${
						equipments.armor.equipped
							? equipments.armor.equipped
									.replace(/([A-Z])/g, " $1")
									.toLowerCase()
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")
							: "None"
					}\n**• ${constants.assets.gloves.emoji} Gloves:** ${
						equipments.gloves.equipped
							? equipments.gloves.equipped
									.replace(/([A-Z])/g, " $1")
									.toLowerCase()
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")
							: "None"
					}`,
					inline: true,
				},
			])
			.setImage(character.get("img"))
			.setTimestamp()
			.setFooter({
				text: "https://patreon.com/jasminebot",
				iconURL: client.user.displayAvatarURL(),
			});

		message.reply({ embeds: [embed] });
	},
};
