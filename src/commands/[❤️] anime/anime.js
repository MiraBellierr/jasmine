const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const { argsError } = require("../../utils/errors");

module.exports = {
	name: "anime",
	description: "Search for an Anime, character or Manga",
	category: "[❤️] anime",
	usage: "<name> [--anime | --character | --manga]",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		const m = await message.reply("*please wait...*");

		const contents = args.join(" ").split("--");
		const query = encodeURIComponent(contents[0]);
		let type = "anime";

		if (contents[1]) type = contents[1];

		axios({
			method: "get",
			url: `https://api.jikan.moe/v3/search/${type}?q=${query}`,
			headers: {
				"Content-Type": "application/json",
			},
		}).then(
			async (response) => {
				if (type === "anime") {
					const anime = response.data.results[0];
					const startDate = moment(anime.start_date).format(
						"dddd, MMMM Do YYYY, h:mm:ss a"
					);
					const endDate = moment(anime.end_date).format(
						"dddd, MMMM Do YYYY, h:mm:ss a"
					);

					const embed = new Discord.EmbedBuilder()
						.setAuthor({
							name: "Anime Search",
							iconURL: message.author.displayAvatarURL(),
						})
						.setTitle(anime.title)
						.setURL(anime.url)
						.setThumbnail(client.user.displayAvatarURL())
						.setDescription(anime.synopsis)
						.addFields([
							{
								name: "Type",
								value: `${anime.type ? anime.type : "N/A"}`,
								inline: true,
							},
							{
								name: "Episodes",
								value: anime.episodes === 0 ? "???" : `${anime.episodes}`,
								inline: true,
							},
							{
								name: "Score",
								value: `${anime.score ? anime.score : "???"}`,
								inline: true,
							},
							{
								name: "Start Date",
								value: `${startDate ? startDate : "???"}`,
								inline: true,
							},
							{
								name: "End Date",
								value: anime.end_date === null ? "???" : `${endDate}`,
								inline: true,
							},
							{
								name: "Members",
								value: `${anime.members.toLocaleString()}`,
								inline: true,
							},
							{
								name: "Rated",
								value: `${anime.rated ? anime.rated : "???"}`,
								inline: true,
							},
						])
						.setColor("#CD1C6C")
						.setImage(anime.image_url)
						.setTimestamp()
						.setFooter({ text: `ID: ${anime.mal_id}` });

					m.delete();

					return message.reply({ embeds: [embed] });
				} else if (type === "character") {
					const character = response.data.results[0];
					const altNames = character.alternative_names
						.map((charname) => `${charname}`)
						.join(", ");
					const anime = character.anime
						.splice(0, 5)
						.map((anime2) => `${anime2.name}`)
						.join(", ");
					const manga = character.manga
						.splice(0, 5)
						.map((manga2) => `${manga2.name}`)
						.join(", ");

					const embed = new Discord.EmbedBuilder()
						.setAuthor({
							name: "Character Search",
							iconURL: message.author.displayAvatarURL(),
						})
						.setTitle(character.name)
						.setURL(character.url)
						.setThumbnail(client.user.displayAvatarURL())
						.addFields([
							{
								name: "Alternative_name",
								value: `${altNames ? altNames : "???"}`,
							},
							{
								name: "Anime",
								value: `${anime ? anime : "???"}`,
							},
							{
								name: "Manga",
								value: `${manga ? manga : "???"}`,
							},
						])
						.setColor("#CD1C6C")
						.setImage(character.image_url)
						.setTimestamp()
						.setFooter({ text: `ID: ${character.mal_id}` });

					m.delete();

					return message.reply({ embeds: [embed] });
				} else if (type === "manga") {
					const manga = response.data.results[0];
					const startDate = moment(manga.start_date).format(
						"dddd, MMMM Do YYYY, h:mm:ss a"
					);
					const endDate = moment(manga.end_date).format(
						"dddd, MMMM Do YYYY, h:mm:ss a"
					);

					const embed = new Discord.EmbedBuilder()
						.setAuthor({
							name: "Manga Search",
							iconURL: message.author.displayAvatarURL(),
						})
						.setTitle(manga.title)
						.setURL(manga.url)
						.setThumbnail(client.user.displayAvatarURL())
						.setDescription(manga.synopsis)
						.addFields([
							{
								name: "Type",
								value: `${manga.type ? manga.type : "???"}`,
								inline: true,
							},
							{
								name: "Chapters",
								value: manga.chapters === 0 ? "???" : `${manga.chapters}`,
								inline: true,
							},
							{
								name: "Volumes",
								value: manga.volumes === 0 ? "???" : `${manga.volumes}`,
								inline: true,
							},
							{
								name: "Score",
								value: `${manga.score ? manga.score : "???"}`,
								inline: true,
							},
							{
								name: "Start Date",
								value: `${startDate ? startDate : "???"}`,
								inline: true,
							},
							{
								name: "End Date",
								value: manga.end_date === null ? "???" : `${endDate}`,
								inline: true,
							},
							{
								name: "Members",
								value: `${manga.members.toLocaleString()}`,
								inline: true,
							},
						])
						.setColor("#CD1C6C")
						.setImage(manga.image_url)
						.setTimestamp()
						.setFooter({ text: `ID: ${manga.mal_id}` });

					m.delete();

					return message.reply({ embeds: [embed] });
				} else {
					return argsError(module.exports, client, message);
				}
			},
			() => {
				m.delete();

				return message.reply("I didn't find any result");
			}
		);
	},
	interaction: {
		data: {
			name: "anime",
			type: 1,
			description: "Search for an anime",
			options: [
				{
					name: "anime",
					type: 1,
					description: "Search for an anime",
					options: [
						{
							name: "title",
							type: 3,
							description: "The title of the anime",
							required: true,
						},
					],
				},
				{
					name: "character",
					type: 1,
					description: "Search for a character",
					options: [
						{
							name: "name",
							type: 3,
							description: "The name of the character",
							required: true,
						},
					],
				},
				{
					name: "manga",
					type: 1,
					description: "Search for a manga",
					options: [
						{
							name: "title",
							type: 3,
							description: "The title of the manga",
							required: true,
						},
					],
				},
			],
		},
		run: async (client, interaction) => {
			const contents =
				interaction.options.getString("title") ||
				interaction.options.getString("name");

			const query = encodeURIComponent(contents);
			const type = interaction.options.getSubcommand();

			axios({
				method: "get",
				url: `https://api.jikan.moe/v3/search/${type}?q=${query}`,
				headers: {
					"Content-Type": "application/json",
				},
			}).then(
				async (response) => {
					if (type === "anime") {
						const anime = response.data.results[0];
						const startDate = moment(anime.start_date).format(
							"dddd, MMMM Do YYYY, h:mm:ss a"
						);
						const endDate = moment(anime.end_date).format(
							"dddd, MMMM Do YYYY, h:mm:ss a"
						);

						const embed = new Discord.EmbedBuilder()
							.setAuthor({
								name: "Anime Search",
								iconURL: interaction.user.displayAvatarURL(),
							})
							.setTitle(anime.title)
							.setURL(anime.url)
							.setThumbnail(client.user.displayAvatarURL())
							.setDescription(anime.synopsis)
							.addFields([
								{
									name: "Type",
									value: `${anime.type ? anime.type : "???"}`,
									inline: true,
								},
								{
									name: "Episodes",
									value: anime.episodes === 0 ? "???" : `${anime.episodes}`,
									inline: true,
								},
								{
									name: "Score",
									value: `${anime.score ? anime.score : "???"}`,
									inline: true,
								},
								{
									name: "Start Date",
									value: `${startDate ? startDate : "???"}`,
									inline: true,
								},
								{
									name: "End Date",
									value: anime.end_date === null ? "???" : `${endDate}`,
									inline: true,
								},
								{
									name: "Members",
									value: `${anime.members.toLocaleString()}`,
									inline: true,
								},
								{
									name: "Rated",
									value: `${anime.rated ? anime.rated : "???"}`,
									inline: true,
								},
							])
							.setColor("#CD1C6C")
							.setImage(anime.image_url)
							.setTimestamp()
							.setFooter({ text: `ID: ${anime.mal_id}` });

						return interaction.reply({ embeds: [embed] });
					} else if (type === "character") {
						const character = response.data.results[0];
						const altNames = character.alternative_names
							.map((charname) => `${charname}`)
							.join(", ");
						const anime = character.anime
							.splice(0, 5)
							.map((anime2) => `${anime2.name}`)
							.join(", ");
						const manga = character.manga
							.splice(0, 5)
							.map((manga2) => `${manga2.name}`)
							.join(", ");

						const embed = new Discord.EmbedBuilder()
							.setAuthor({
								name: "Character Search",
								iconURL: interaction.user.displayAvatarURL(),
							})
							.setTitle(character.name)
							.setURL(character.url)
							.setThumbnail(client.user.displayAvatarURL())
							.addFields([
								{
									name: "Alternative_name",
									value: `${altNames ? altNames : "???"}`,
								},
								{
									name: "Anime",
									value: `${anime ? anime : "???"}`,
								},
								{
									name: "Manga",
									value: `${manga ? manga : "???"}`,
								},
							])
							.setColor("#CD1C6C")
							.setImage(character.image_url)
							.setTimestamp()
							.setFooter({ text: `ID: ${character.mal_id}` });

						return interaction.reply({ embeds: [embed] });
					} else if (type === "manga") {
						const manga = response.data.results[0];
						const startDate = moment(manga.start_date).format(
							"dddd, MMMM Do YYYY, h:mm:ss a"
						);
						const endDate = moment(manga.end_date).format(
							"dddd, MMMM Do YYYY, h:mm:ss a"
						);

						const embed = new Discord.EmbedBuilder()
							.setAuthor({
								name: "Manga Search",
								iconURL: interaction.user.displayAvatarURL(),
							})
							.setTitle(manga.title)
							.setURL(manga.url)
							.setThumbnail(client.user.displayAvatarURL())
							.setDescription(manga.synopsis)
							.addFields([
								{
									name: "Type",
									value: `${manga.type ? manga.type : "???"}`,
									inline: true,
								},
								{
									name: "Chapters",
									value: manga.chapters === 0 ? "???" : `${manga.chapters}`,
									inline: true,
								},
								{
									name: "Volumes",
									value: manga.volumes === 0 ? "???" : `${manga.volumes}`,
									inline: true,
								},
								{
									name: "Score",
									value: `${manga.score ? manga.score : "???"}`,
									inline: true,
								},
								{
									name: "Start Date",
									value: `${startDate ? startDate : "???"}`,
									inline: true,
								},
								{
									name: "End Date",
									value: manga.end_date === null ? "???" : `${endDate}`,
									inline: true,
								},
								{
									name: "Members",
									value: `${manga.members.toLocaleString()}`,
									inline: true,
								},
							])
							.setColor("#CD1C6C")
							.setImage(manga.image_url)
							.setTimestamp()
							.setFooter({ text: `ID: ${manga.mal_id}` });

						return interaction.reply({ embeds: [embed] });
					}
				},
				() => {
					return interaction.reply("I didn't find any result");
				}
			);
		},
	},
};
