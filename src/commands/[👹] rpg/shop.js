const schemas = require("../../database/schemas");
const equipments = require("../../database/json/equipments.json");
const Discord = require("discord.js");
const constants = require("../../utils/constants");
const economies = require("../../utils/economies");

module.exports = {
	name: "shop",
	aliases: ["sh"],
	description: "Shows RPG shop",
	category: "[👹] rpg",
	run: async (client, message, args) => {
		const character = await schemas
			.character()
			.findOne({ where: { userID: message.author.id } });

		if (!character)
			return message.reply(
				"You are not registered yet. Please type `" +
					client.prefixes.get(message.guild.id) +
					"register <class>` to register"
			);

		const playerClass = character.get("class");
		const playerEquipments = JSON.parse(character.get("equipments"));

		const weapons = Object.fromEntries(
			Object.entries(equipments.weapons)
				.filter(
					([name, weapon]) =>
						weapon.classes.includes(playerClass) &&
						!playerEquipments.weapons.inventory.includes(name)
				)
				.sort((a, b) => a[1].cost - b[1].cost)
		);

		const shields = Object.fromEntries(
			Object.entries(equipments.shields)
				.filter(
					([name, shield]) =>
						shield.classes.includes(playerClass) &&
						!playerEquipments.shields.inventory.includes(name)
				)
				.sort((a, b) => a[1].cost - b[1].cost)
		);

		const helmet = Object.fromEntries(
			Object.entries(equipments.helmet)
				.filter(
					([name, helmet]) =>
						helmet.classes.includes(playerClass) &&
						!playerEquipments.helmet.inventory.includes(name)
				)
				.sort((a, b) => a[1].cost - b[1].cost)
		);

		const armor = Object.fromEntries(
			Object.entries(equipments.armor)
				.filter(
					([name, armor]) =>
						armor.classes.includes(playerClass) &&
						!playerEquipments.armor.inventory.includes(name)
				)
				.sort((a, b) => a[1].cost - b[1].cost)
		);

		const gloves = Object.fromEntries(
			Object.entries(equipments.gloves)
				.filter(
					([name, gloves]) =>
						gloves.classes.includes(playerClass) &&
						!playerEquipments.gloves.inventory.includes(name)
				)
				.sort((a, b) => a[1].cost - b[1].cost)
		);

		const row = new Discord.ActionRowBuilder().addComponents(
			new Discord.SelectMenuBuilder()
				.setCustomId("equipments")
				.setPlaceholder("Nothing Selected")
				.addOptions(
					{
						label: "Weapons",
						description: "List of Weapons",
						value: "weapons",
						emoji: constants.assets.weapon.emoji,
					},
					{
						label: "Shields",
						description: "List of Shields",
						value: "shields",
						emoji: constants.assets.shield.emoji,
					},
					{
						label: "Helmet",
						description: "List of Helmet",
						value: "helmet",
						emoji: constants.assets.helmet.emoji,
					},
					{
						label: "Armor",
						description: "List of Armor",
						value: "armor",
						emoji: constants.assets.armor.emoji,
					},
					{
						label: "Gloves",
						description: "List of Gloves",
						value: "gloves",
						emoji: constants.assets.gloves.emoji,
					}
				)
		);

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL(),
			})
			.setTitle("Shop")
			.setDescription("> Please select a category below!")
			.setColor("#0099ff")
			.setThumbnail(
				"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
			)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			});

		const m = await message.channel.send({
			embeds: [embed],
			components: [row],
		});

		collector();

		function collector() {
			const filter = (interaction) => interaction.user.id === message.author.id;

			m.awaitMessageComponent({
				filter,
				time: 15_000,
			}).then(
				(interaction) => {
					if (interaction.values.includes("weapons")) {
						let weaponsText = [];

						for (let [name, weapon] of Object.entries(weapons)) {
							weaponsText.push(
								`**• ${name
									.replace(/([A-Z])/g, " $1")
									.split(" ")
									.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
									.join(" ")}** \`${Object.keys(weapon.attr)
									.map((a) => `${a}:${weapon.attr[a]}`)
									.join("|")}\` - ${constants.coins.emoji} ${weapon.cost}`
							);
						}

						if (weaponsText.length === 0)
							weaponsText = [[[["Nothing to show"]]]];

						const weaponsEmbed = new Discord.EmbedBuilder()
							.setAuthor({
								name: message.author.username,
								iconURL: message.author.displayAvatarURL(),
							})
							.setTitle("Weapons")
							.setDescription(weaponsText.join("\n"))
							.setColor("#0099ff")
							.setThumbnail(
								"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
							)
							.setFooter({
								text: `To buy, type ${client.prefixes.get(
									message.guild.id
								)}buy <name>`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.update({
							embeds: [weaponsEmbed],
						});

						collector();
					}

					if (interaction.values.includes("shields")) {
						let shieldsText = [];

						for (let [name, shield] of Object.entries(shields)) {
							shieldsText.push(
								`**• ${name
									.replace(/([A-Z])/g, " $1")
									.split(" ")
									.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
									.join(" ")}** \`${Object.keys(shield.attr)
									.map((a) => `${a}:${shield.attr[a]}`)
									.join("|")}\` - ${constants.coins.emoji} ${shield.cost}`
							);
						}

						if (shieldsText.length === 0) shieldsText = [[["Nothing to show"]]];

						const shieldsEmbed = new Discord.EmbedBuilder()
							.setAuthor({
								name: message.author.username,
								iconURL: message.author.displayAvatarURL(),
							})
							.setTitle("Shields")
							.setDescription(shieldsText.join("\n"))
							.setColor("#0099ff")
							.setThumbnail(
								"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
							)
							.setFooter({
								text: `To buy, type ${client.prefixes.get(
									message.guild.id
								)}buy <name>`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.update({
							embeds: [shieldsEmbed],
						});

						collector();
					}

					if (interaction.values.includes("helmet")) {
						let helmetText = [];

						for (let [name, helmett] of Object.entries(helmet)) {
							helmetText.push(
								`**• ${name
									.replace(/([A-Z])/g, " $1")
									.split(" ")
									.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
									.join(" ")}** \`${Object.keys(helmett.attr)
									.map((a) => `${a}:${helmett.attr[a]}`)
									.join("|")}\` - ${constants.coins.emoji} ${helmett.cost}`
							);
						}

						if (helmetText.length === 0) helmetText = [["Nothing to show"]];

						const helmetEmbed = new Discord.EmbedBuilder()
							.setAuthor({
								name: message.author.username,
								iconURL: message.author.displayAvatarURL(),
							})
							.setTitle("Helmet")
							.setDescription(helmetText.join("\n"))
							.setColor("#0099ff")
							.setThumbnail(
								"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
							)
							.setFooter({
								text: `To buy, type ${client.prefixes.get(
									message.guild.id
								)}buy <name>`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.update({
							embeds: [helmetEmbed],
						});

						collector();
					}

					if (interaction.values[0] === "armor") {
						let armorText = [];

						for (let [name, armort] of Object.entries(armor)) {
							armorText.push(
								`**• ${name
									.replace(/([A-Z])/g, " $1")
									.split(" ")
									.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
									.join(" ")}** \`${Object.keys(armort.attr)
									.map((a) => `${a}:${armort.attr[a]}`)
									.join("|")}\` - ${constants.coins.emoji} ${armort.cost}`
							);
						}

						if (armorText.length === 0) armorText = [["Nothing to show"]];

						const armorEmbed = new Discord.EmbedBuilder()
							.setAuthor({
								name: message.author.username,
								iconURL: message.author.displayAvatarURL(),
							})
							.setTitle("Armor")
							.setDescription(armorText.join("\n"))
							.setColor("#0099ff")
							.setThumbnail(
								"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
							)
							.setFooter({
								text: `To buy, type ${client.prefixes.get(
									message.guild.id
								)}buy <name>`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.update({
							embeds: [armorEmbed],
						});

						collector();
					}

					if (interaction.values.includes("gloves")) {
						let glovesText = [];

						for (let [name, glove] of Object.entries(gloves)) {
							glovesText.push(
								`**• ${name
									.replace(/([A-Z])/g, " $1")
									.split(" ")
									.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
									.join(" ")}** \`${Object.keys(glove.attr)
									.map((a) => `${a}:${glove.attr[a]}`)
									.join("|")}\` - ${constants.coins.emoji} ${glove.cost}`
							);
						}

						if (glovesText.length === 0) glovesText = ["Nothing to show"];

						const glovesEmbed = new Discord.EmbedBuilder()
							.setAuthor({
								name: message.author.username,
								iconURL: message.author.displayAvatarURL(),
							})
							.setTitle("Gloves")
							.setDescription(glovesText.join("\n"))
							.setColor("#0099ff")
							.setThumbnail(
								"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
							)
							.setFooter({
								text: `To buy, type ${client.prefixes.get(
									message.guild.id
								)}buy <name>`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.update({
							embeds: [glovesEmbed],
						});

						collector();
					}
				},
				() => null
			);
		}
	},
	interaction: {
		data: {
			name: "shop",
			type: 1,
			description: "Shows the shop",
			options: [
				{
					name: "list",
					type: 1,
					description: "Shows the list of equipments",
				},
				{
					name: "buy",
					type: 1,
					description: "Buys an equipment",
					options: [
						{
							name: "name",
							type: 3,
							description: "The name of the equipment",
							required: true,
						},
					],
				},
			],
		},
		run: async (client, interaction) => {
			const subcommand = interaction.options.getSubcommand();

			if (subcommand === "list") {
				const character = await schemas
					.character()
					.findOne({ where: { userID: interaction.user.id } });

				if (!character) return interaction.reply("You are not registered yet.");

				const playerClass = character.get("class");
				const playerEquipments = JSON.parse(character.get("equipments"));

				const weapons = Object.fromEntries(
					Object.entries(equipments.weapons)
						.filter(
							([name, weapon]) =>
								weapon.classes.includes(playerClass) &&
								!playerEquipments.weapons.inventory.includes(name)
						)
						.sort((a, b) => a[1].cost - b[1].cost)
				);

				const shields = Object.fromEntries(
					Object.entries(equipments.shields)
						.filter(
							([name, shield]) =>
								shield.classes.includes(playerClass) &&
								!playerEquipments.shields.inventory.includes(name)
						)
						.sort((a, b) => a[1].cost - b[1].cost)
				);

				const helmet = Object.fromEntries(
					Object.entries(equipments.helmet)
						.filter(
							([name, helmet]) =>
								helmet.classes.includes(playerClass) &&
								!playerEquipments.helmet.inventory.includes(name)
						)
						.sort((a, b) => a[1].cost - b[1].cost)
				);

				const armor = Object.fromEntries(
					Object.entries(equipments.armor)
						.filter(
							([name, armor]) =>
								armor.classes.includes(playerClass) &&
								!playerEquipments.armor.inventory.includes(name)
						)
						.sort((a, b) => a[1].cost - b[1].cost)
				);

				const gloves = Object.fromEntries(
					Object.entries(equipments.gloves)
						.filter(
							([name, gloves]) =>
								gloves.classes.includes(playerClass) &&
								!playerEquipments.gloves.inventory.includes(name)
						)
						.sort((a, b) => a[1].cost - b[1].cost)
				);

				const row = new Discord.ActionRowBuilder().addComponents(
					new Discord.SelectMenuBuilder()
						.setCustomId("equipments")
						.setPlaceholder("Nothing Selected")
						.addOptions(
							{
								label: "Weapons",
								description: "List of Weapons",
								value: "weapons",
								emoji: constants.assets.weapon.emoji,
							},
							{
								label: "Shields",
								description: "List of Shields",
								value: "shields",
								emoji: constants.assets.shield.emoji,
							},
							{
								label: "Helmet",
								description: "List of Helmet",
								value: "helmet",
								emoji: constants.assets.helmet.emoji,
							},
							{
								label: "Armor",
								description: "List of Armor",
								value: "armor",
								emoji: constants.assets.armor.emoji,
							},
							{
								label: "Gloves",
								description: "List of Gloves",
								value: "gloves",
								emoji: constants.assets.gloves.emoji,
							}
						)
				);

				const embed = new Discord.EmbedBuilder()
					.setAuthor({
						name: interaction.user.username,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setTitle("Shop")
					.setDescription("> Please select a category below!")
					.setColor("#0099ff")
					.setThumbnail(
						"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
					)
					.setFooter({
						text: client.user.username,
						iconURL: client.user.displayAvatarURL(),
					});

				const m = await interaction.reply({
					embeds: [embed],
					components: [row],
				});

				collector();

				function collector() {
					const filter = (i) => i.user.id === interaction.user.id;

					m.awaitMessageComponent({
						filter,
						time: 15_000,
					}).then(
						(interaction) => {
							if (interaction.values.includes("weapons")) {
								let weaponsText = [];

								for (let [name, weapon] of Object.entries(weapons)) {
									weaponsText.push(
										`**• ${name
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
											.join(" ")}** \`${Object.keys(weapon.attr)
											.map((a) => `${a}:${weapon.attr[a]}`)
											.join("|")}\` - ${constants.coins.emoji} ${weapon.cost}`
									);
								}

								if (weaponsText.length === 0)
									weaponsText = [[[["Nothing to show"]]]];

								const weaponsEmbed = new Discord.EmbedBuilder()
									.setAuthor({
										name: interaction.user.username,
										iconURL: interaction.user.displayAvatarURL(),
									})
									.setTitle("Weapons")
									.setDescription(weaponsText.join("\n"))
									.setColor("#0099ff")
									.setThumbnail(
										"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
									)
									.setFooter({
										text: "To buy, use /shop buy <name>",
										iconURL: client.user.displayAvatarURL(),
									});

								interaction.update({
									embeds: [weaponsEmbed],
								});

								collector();
							}

							if (interaction.values.includes("shields")) {
								let shieldsText = [];

								for (let [name, shield] of Object.entries(shields)) {
									shieldsText.push(
										`**• ${name
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
											.join(" ")}** \`${Object.keys(shield.attr)
											.map((a) => `${a}:${shield.attr[a]}`)
											.join("|")}\` - ${constants.coins.emoji} ${shield.cost}`
									);
								}

								if (shieldsText.length === 0)
									shieldsText = [[["Nothing to show"]]];

								const shieldsEmbed = new Discord.EmbedBuilder()
									.setAuthor({
										name: interaction.user.username,
										iconURL: interaction.user.displayAvatarURL(),
									})
									.setTitle("Shields")
									.setDescription(shieldsText.join("\n"))
									.setColor("#0099ff")
									.setThumbnail(
										"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
									)
									.setFooter({
										text: "To buy, use /shop buy <name>",
										iconURL: client.user.displayAvatarURL(),
									});

								interaction.update({
									embeds: [shieldsEmbed],
								});

								collector();
							}

							if (interaction.values.includes("helmet")) {
								let helmetText = [];

								for (let [name, helmett] of Object.entries(helmet)) {
									helmetText.push(
										`**• ${name
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
											.join(" ")}** \`${Object.keys(helmett.attr)
											.map((a) => `${a}:${helmett.attr[a]}`)
											.join("|")}\` - ${constants.coins.emoji} ${helmett.cost}`
									);
								}

								if (helmetText.length === 0) helmetText = [["Nothing to show"]];

								const helmetEmbed = new Discord.EmbedBuilder()
									.setAuthor({
										name: interaction.user.username,
										iconURL: interaction.user.displayAvatarURL(),
									})
									.setTitle("Helmet")
									.setDescription(helmetText.join("\n"))
									.setColor("#0099ff")
									.setThumbnail(
										"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
									)
									.setFooter({
										text: "To buy, use /shop buy <name>",
										iconURL: client.user.displayAvatarURL(),
									});

								interaction.update({
									embeds: [helmetEmbed],
								});

								collector();
							}

							if (interaction.values[0] === "armor") {
								let armorText = [];

								for (let [name, armort] of Object.entries(armor)) {
									armorText.push(
										`**• ${name
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
											.join(" ")}** \`${Object.keys(armort.attr)
											.map((a) => `${a}:${armort.attr[a]}`)
											.join("|")}\` - ${constants.coins.emoji} ${armort.cost}`
									);
								}

								if (armorText.length === 0) armorText = [["Nothing to show"]];

								const armorEmbed = new Discord.EmbedBuilder()
									.setAuthor({
										name: interaction.user.username,
										iconURL: interaction.user.displayAvatarURL(),
									})
									.setTitle("Armor")
									.setDescription(armorText.join("\n"))
									.setColor("#0099ff")
									.setThumbnail(
										"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
									)
									.setFooter({
										text: "To buy, use /shop buy <name>",
										iconURL: client.user.displayAvatarURL(),
									});

								interaction.update({
									embeds: [armorEmbed],
								});

								collector();
							}

							if (interaction.values.includes("gloves")) {
								let glovesText = [];

								for (let [name, glove] of Object.entries(gloves)) {
									glovesText.push(
										`**• ${name
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a.charAt(0).toUpperCase() + a.slice(1))
											.join(" ")}** \`${Object.keys(glove.attr)
											.map((a) => `${a}:${glove.attr[a]}`)
											.join("|")}\` - ${constants.coins.emoji} ${glove.cost}`
									);
								}

								if (glovesText.length === 0) glovesText = ["Nothing to show"];

								const glovesEmbed = new Discord.EmbedBuilder()
									.setAuthor({
										name: interaction.user.username,
										iconURL: interaction.user.displayAvatarURL(),
									})
									.setTitle("Gloves")
									.setDescription(glovesText.join("\n"))
									.setColor("#0099ff")
									.setThumbnail(
										"https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/089d21ad-7782-4104-89c2-a65435feaa61/d9dbds5-953028f0-861a-4db8-9b6f-91162fe1959d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8wODlkMjFhZC03NzgyLTQxMDQtODljMi1hNjU0MzVmZWFhNjEvZDlkYmRzNS05NTMwMjhmMC04NjFhLTRkYjgtOWI2Zi05MTE2MmZlMTk1OWQuZ2lmIn1dXX0.Ez2k2AdkZOj3eKeJx4YhE301riLSPQT8dXLtBGFYGh8"
									)
									.setFooter({
										text: "To buy, use /shop buy <name>",
										iconURL: client.user.displayAvatarURL(),
									});

								interaction.update({
									embeds: [glovesEmbed],
								});

								collector();
							}
						},
						() => null
					);
				}
			} else if (subcommand === "buy") {
				const character = await schemas
					.character()
					.findOne({ where: { userID: interaction.user.id } });

				if (!character) return interaction.reply("You are not registered yet.");

				const coins = await economies.getCoins(interaction.user);

				const playerClass = character.get("class");
				const playerEquipments = JSON.parse(character.get("equipments"));

				const weapons = Object.fromEntries(
					Object.entries(equipments.weapons).filter(
						([name, weapon]) =>
							weapon.classes.includes(playerClass) &&
							!playerEquipments.weapons.inventory.includes(name)
					)
				);

				const shields = Object.fromEntries(
					Object.entries(equipments.shields).filter(
						([name, shield]) =>
							shield.classes.includes(playerClass) &&
							!playerEquipments.shields.inventory.includes(name)
					)
				);

				const helmet = Object.fromEntries(
					Object.entries(equipments.helmet).filter(
						([name, helmet]) =>
							helmet.classes.includes(playerClass) &&
							!playerEquipments.helmet.inventory.includes(name)
					)
				);

				const armor = Object.fromEntries(
					Object.entries(equipments.armor).filter(
						([name, armor]) =>
							armor.classes.includes(playerClass) &&
							!playerEquipments.armor.inventory.includes(name)
					)
				);

				const gloves = Object.fromEntries(
					Object.entries(equipments.gloves).filter(
						([name, gloves]) =>
							gloves.classes.includes(playerClass) &&
							!playerEquipments.gloves.inventory.includes(name)
					)
				);

				const prompt = interaction.options
					.getString("name")
					.replace(/ /g, "")
					.toLowerCase();

				const weapon =
					weapons[
						Object.keys(weapons).find((name) => name.toLowerCase() === prompt)
					];
				const shield =
					shields[
						Object.keys(shields).find((name) => name.toLowerCase() === prompt)
					];
				const helmett =
					helmet[
						Object.keys(helmet).find((name) => name.toLowerCase() === prompt)
					];
				const armort =
					armor[
						Object.keys(armor).find((name) => name.toLowerCase() === prompt)
					];
				const glove =
					gloves[
						Object.keys(gloves).find((name) => name.toLowerCase() === prompt)
					];

				if (!weapon && !shield && !helmett && !armort && !glove)
					return interaction.reply("No equipment found with this name.");

				if (weapon) {
					if (coins.get("wallet") < weapon.cost)
						return interaction.reply("You don't have enough coins to buy this");

					schemas.coins().update(
						{
							wallet: coins.get("wallet") - weapon.cost,
						},
						{ where: { userID: interaction.user.id } }
					);

					const name = Object.keys(weapons).find(
						(name) => name.toLowerCase() === prompt
					);

					playerEquipments.weapons.inventory.push(name);

					interaction.reply(
						`You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
							constants.coins.emoji
						} ${weapon.cost}!`
					);
				} else if (shield) {
					if (coins.get("wallet") < shield.cost)
						return interaction.reply("You don't have enough coins to buy this");

					schemas.coins().update(
						{
							wallet: coins.get("wallet") - shield.cost,
						},
						{ where: { userID: interaction.user.id } }
					);

					const name = Object.keys(shields).find(
						(name) => name.toLowerCase() === prompt
					);

					playerEquipments.shields.inventory.push(name);

					interaction.reply(
						`You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
							constants.coins.emoji
						} ${shield.cost}!`
					);
				} else if (helmett) {
					if (coins.get("wallet") < helmett.cost)
						return interaction.reply("You don't have enough coins to buy this");

					schemas.coins().update(
						{
							wallet: coins.get("wallet") - helmett.cost,
						},
						{ where: { userID: interaction.user.id } }
					);

					const name = Object.keys(helmet).find(
						(name) => name.toLowerCase() === prompt
					);

					playerEquipments.helmet.inventory.push(name);

					interaction.reply(
						`You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
							constants.coins.emoji
						} ${helmett.cost}!`
					);
				} else if (armort) {
					if (coins.get("wallet") < armort.cost)
						return interaction.reply("You don't have enough coins to buy this");

					schemas.coins().update(
						{
							wallet: coins.get("wallet") - armort.cost,
						},
						{ where: { userID: interaction.user.id } }
					);

					const name = Object.keys(armor).find(
						(name) => name.toLowerCase() === prompt
					);

					playerEquipments.armor.inventory.push(name);

					interaction.reply(
						`You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
							constants.coins.emoji
						} ${armort.cost}!`
					);
				} else if (glove) {
					if (coins.get("wallet") < glove.cost)
						return interaction.reply("You don't have enough coins to buy this");

					schemas.coins().update(
						{
							wallet: coins.get("wallet") - glove.cost,
						},
						{ where: { userID: interaction.user.id } }
					);

					const name = Object.keys(gloves).find(
						(name) => name.toLowerCase() === prompt
					);

					playerEquipments.gloves.inventory.push(name);

					interaction.reply(
						`You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
							constants.coins.emoji
						} ${glove.cost}!`
					);
				}

				schemas.character().update(
					{
						equipments: JSON.stringify(playerEquipments),
					},
					{ where: { userID: interaction.user.id } }
				);
			}
		},
	},
};
