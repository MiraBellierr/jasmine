const { MessageEmbed } = require("discord.js");
const axios = require("axios");
const { Paginate } = require("../../utils/pagination");
const Error = require("../../utils/Error");
const Util = require("../../utils/Util");

module.exports = {
	name: "country",
	description: "Display country information",
	category: "[✨] utility",
	usage: "<country>",
	run: async (client, message, args) => {
		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		let name = args.join(" ").toLowerCase();
		let url = `https://restcountries.com/v3.1/name/${name}`;

		if (name === "usa" || name === "united states")
			name = "united states of america";

		const m = await message.reply("Please wait...");

		let response;

		try {
			response = await axios({
				method: "get",
				url,
			});
		} catch (err) {
			if (err.message.includes("404")) {
				message.reply(`Error: Country not found.`);
			} else {
				message.reply(`Error: ${err.message}.`);
			}
			m.delete();
			return;
		}

		const data = response.data[0];
		const flag = data.flags.png;
		let nativeNames = "";
		let tlds = data.tld.join(", ");
		let currencies = "";
		let translations = "";
		let demonyms = "";
		let gini = "";

		Object.keys(data.name.nativeName).forEach((key) => {
			nativeNames = nativeNames.concat(
				" ",
				`**• ${key}:** ${data.name.nativeName[key].official}, ${data.name.nativeName[key].common}\n`
			);
		});

		Object.keys(data.currencies).forEach((key) => {
			currencies = currencies.concat(
				" ",
				`**• ${key}:** ${data.currencies[key].name} (${data.currencies[key].symbol})\n`
			);
		});

		Object.keys(data.translations).forEach((key) => {
			translations = translations.concat(
				" ",
				`**• ${key}:** ${data.translations[key].official}, ${data.translations[key].common}\n`
			);
		});

		Object.keys(data.demonyms).forEach((key) => {
			demonyms = demonyms.concat(
				" ",
				`**• ${key}:** Male: ${data.demonyms[key].m} | Female: ${data.demonyms[key].f}\n`
			);
		});

		Object.keys(data.gini).forEach((key) => {
			gini = gini.concat(" ", `**• ${key}:** ${data.gini[key]}\n`);
		});

		const embed = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp()
			.addField(
				"Name",
				`**• Common:** ${data.name.common}\n**• Official:** ${data.name.official}`
			)
			.addField("Native Name", `${nativeNames}`)
			.addField(
				"Country Information",
				`**• Top Level Domain:** ${tlds}\n**• Country Code Alpha 2:** ${
					data.cca2
				}\n**• Country Code Alpha 3:** ${
					data.cca3
				}\n**• Country Code Numeric 3:** ${
					data.ccn3
				}\n**• Country International Olympic Committee:** ${
					data.cioc
				}\n**• Independent:** ${
					data.independent ? "Yes" : "No"
				}\n**• Status:** ${data.status}\n**• United Nations Member:** ${
					data.unMember ? "Yes" : "No"
				}\n**• Capital:** ${data.capital.join(
					", "
				)}\n**• Alternative Spellings:** ${data.altSpellings.join(
					", "
				)}\n**• Region:** ${data.region}`
			);

		const embed2 = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp()
			.addField(
				"Country Information 2",
				`**• Sub Region:** ${data.subregion}\n**• Languages:** ${Object.values(
					data.languages
				).join(", ")}\n**• Coordinates:** (${data.latlng[0]}, ${
					data.latlng[1]
				})\n**• Land Locked:** ${
					data.landlocked ? "Yes" : "No"
				}\n**• Borders:** ${data.borders.join(
					", "
				)}\n**• Area:** ${data.area.toLocaleString()} km2\n**• Population:** ${data.population.toLocaleString()}\n**• Fifa:** ${
					data.fifa
				}\n**• Timezones:** ${data.timezones.join(
					", "
				)}\n**• Continents:** ${data.continents.join(
					", "
				)}\n**• Start of Week:** ${
					data.startOfWeek
				}\n**• Capital Coordinates:** (${data.capitalInfo.latlng[0]}, ${
					data.capitalInfo.latlng[1]
				})`
			)
			.addField("Currencies", currencies)
			.addField(
				"International Direct Dialing",
				`**• Root:** ${data.idd.root}\n**• Suffixes:** ${data.idd.suffixes.join(
					", "
				)}`
			);

		const embed3 = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp()
			.addField(
				"Translation",
				new Util().splitMessage(translations, {
					maxLength: 1024,
					append: "...",
				})[0]
			);

		const embed4 = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.addField("Demonyms", demonyms)
			.addField("Gini Index", gini)
			.addField(
				"Car",
				`**• Signs:** ${data.car.signs.join(", ")}\n**• Side:** ${
					data.car.side
				}`
			)
			.addField(
				"Postal Code",
				`**• Format:** ${data.postalCode.format}\n**• Regex:** ${data.postalCode.regex}`
			);

		const embed5 = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setImage(data.flags.png);

		const embed6 = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setThumbnail(flag)
			.setColor("#CD1C6C")
			.setTitle(data.name.official)
			.setURL(data.maps.googleMaps)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setImage(data.coatOfArms.png);

		const embeds = [
			embed,
			embed2,
			embed3,
			embed4,
			embed5,
			embed6,
			`${data.maps.googleMaps}\n${data.maps.openStreetMaps}`,
		];

		new Paginate(client, message, embeds).init();

		m.delete();
	},
};
