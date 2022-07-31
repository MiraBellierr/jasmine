const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../utils/constants");

module.exports = {
	name: "equip",
	description: "Equip an equipment",
	category: "[👹] rpg",
	usage: "<equipment>",
	run: async (client, message, args) => {
		const character = await schemas
			.character()
			.findOne({ where: { userID: message.author.id } });

		if (!character) {
			return message.channel.send(
				`You haven't registered yet! Use \`${client.config.prefix}register\` to register.`
			);
		}

		const playerEquipments = JSON.parse(character.get("equipments"));

		if (!args.length) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL(),
				})
				.setThumbnail(character.get("img"))
				.setColor("#0099ff")
				.setTitle("Equipped Equipments")
				.setDescription(
					`**• ${constants.assets.weapon.emoji} Weapon:** ${
						playerEquipments.weapons.equipped
							? playerEquipments.weapons.equipped
							: "None"
					}\n**• ${constants.assets.shield.emoji} Shield:** ${
						playerEquipments.shields.equipped
							? playerEquipments.shields.equipped
							: "None"
					}\n**• ${constants.assets.helmet.emoji} Helmet:** ${
						playerEquipments.helmet.equipped
							? playerEquipments.helmet.equipped
							: "None"
					}\n**• ${constants.assets.armor.emoji} Armor:** ${
						playerEquipments.armor.equipped
							? playerEquipments.armor.equipped
							: "None"
					}\n**• ${constants.assets.gloves.emoji} Gloves:** ${
						playerEquipments.gloves.equipped
							? playerEquipments.gloves.equipped
							: "None"
					}`
				);

			return message.reply({ embeds: [embed] });
		}

		const prompt = args.join(" ").toLowerCase();

		const weapon = playerEquipments.weapons.inventory.find(
			(a) => a.toLowerCase() === prompt
		);
		const shield = playerEquipments.shields.inventory.find(
			(a) => a.toLowerCase() === prompt
		);
		const helmet = playerEquipments.helmet.inventory.find(
			(a) => a.toLowerCase() === prompt
		);
		const armor = playerEquipments.armor.inventory.find(
			(a) => a.toLowerCase() === prompt
		);
		const gloves = playerEquipments.gloves.inventory.find(
			(a) => a.toLowerCase() === prompt
		);

		if (weapon) {
			playerEquipments.weapons.equipped = weapon;

			message.channel.send(
				`You equipped **${weapon
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()}** as your weapon.`
			);
		} else if (shield) {
			playerEquipments.shields.equipped = shield;

			message.channel.send(
				`You equipped **${shield
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()}** as your shield.`
			);
		} else if (helmet) {
			playerEquipments.helmet.equipped = helmet;

			message.channel.send(
				`You equipped **${helmet
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()}** as your helmet.`
			);
		} else if (armor) {
			playerEquipments.armor.equipped = armor;

			message.channel.send(
				`You equipped **${armor
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()}** as your armor.`
			);
		} else if (gloves) {
			playerEquipments.gloves.equipped = gloves;

			message.channel.send(
				`You equipped **${gloves
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()}** as your gloves.`
			);
		} else {
			return message.channel.send(`You don't have this equipment`);
		}

		schemas.character().update(
			{
				equipments: JSON.stringify(playerEquipments),
			},
			{ where: { userID: message.author.id } }
		);
	},
};
