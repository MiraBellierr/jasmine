const Discord = require("discord.js");
const w = require("weather-js2");
const { argsError } = require("../../utils/errors");
const Paginate = require("../../utils/pagination");

module.exports = {
	name: "weather",
	description: "Send an information about a weather",
	category: "[✨] utility",
	usage: "<location>",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		w.find(
			{ search: args.join(" "), degreeType: "C", resCount: 1 },
			(err, results) => {
				if (err) return console.log(err);

				const result = results[0];
				const currentDay = result.current.date.slice(8);

				const current = new Discord.EmbedBuilder()
					.setAuthor({
						name: result.location.name,
					})
					.setTitle("Today")
					.setDescription(
						`**• Sky:** ${result.current.skytext}\n**• Temperature:** ${result.current.temperature}°C\n**• Feels Like:** ${result.current.feelslike}°C\n**• Humidity:** ${result.current.humidity}%\n**• Wind:** ${result.current.winddisplay}\n**• Day:** ${result.current.day}\n**• Observation Time:** ${result.current.observationtime}`
					)
					.setColor("#CD1C6C")
					.setThumbnail(result.current.imageUrl)
					.setFooter({
						text: result.current.date,
					});

				const forecasts = result.forecast;
				const pages = [];

				pages[1] = current;

				for (let i = 0; i < forecasts.length; i++) {
					const forecast = forecasts[i];
					const dif = parseInt(currentDay - forecast.date.slice(8));

					if (dif === 0) continue;

					const day = checkDay(dif);

					const embed = new Discord.EmbedBuilder()
						.setAuthor({ name: result.location.name })
						.setTitle(day)
						.setDescription(
							`**• Sky:** ${forecast.skytextday}\n**• Low Temperature:** ${forecast.low}°C\n**• High Temperature:** ${forecast.high}°C\n**• Precipitation:** ${forecast.precip}%\n**• Day:** ${forecast.day}`
						)
						.setColor("#CD1C6C")
						.setThumbnail(
							`http://blob.weather.microsoft.com/static/weather4/en-us/law/${forecast.skycodeday}.gif`
						)
						.setFooter({ text: forecast.date });

					if (dif === 1) {
						pages[0] = embed;
					} else if (dif === -1) {
						pages[2] = embed;
					} else if (dif === -2) {
						pages[3] = embed;
					}
				}

				new Paginate.Paginate(client, message, pages, 2).init();
			}
		);
	},
	interaction: {
		data: {
			name: "weather",
			type: 1,
			description: "Send an information about a weather",
			options: [
				{
					name: "location",
					type: 3,
					description: "The location of the weather",
					required: true,
				},
			],
		},
		run: async (client, interaction) => {
			w.find(
				{
					search: interaction.options.getString("location"),
					degreeType: "C",
					resCount: 1,
				},
				(err, results) => {
					if (err) return console.log(err);

					const result = results[0];
					const currentDay = result.current.date.slice(8);

					const current = new Discord.EmbedBuilder()
						.setAuthor({
							name: result.location.name,
						})
						.setTitle("Today")
						.setDescription(
							`**• Sky:** ${result.current.skytext}\n**• Temperature:** ${result.current.temperature}°C\n**• Feels Like:** ${result.current.feelslike}°C\n**• Humidity:** ${result.current.humidity}%\n**• Wind:** ${result.current.winddisplay}\n**• Day:** ${result.current.day}\n**• Observation Time:** ${result.current.observationtime}`
						)
						.setColor("#CD1C6C")
						.setThumbnail(result.current.imageUrl)
						.setFooter({
							text: result.current.date,
						});

					const forecasts = result.forecast;
					const pages = [];

					pages[1] = current;

					for (let i = 0; i < forecasts.length; i++) {
						const forecast = forecasts[i];
						const dif = parseInt(currentDay - forecast.date.slice(8));

						if (dif === 0) continue;

						const day = checkDay(dif);

						const embed = new Discord.EmbedBuilder()
							.setAuthor({ name: result.location.name })
							.setTitle(day)
							.setDescription(
								`**• Sky:** ${forecast.skytextday}\n**• Low Temperature:** ${forecast.low}°C\n**• High Temperature:** ${forecast.high}°C\n**• Precipitation:** ${forecast.precip}%\n**• Day:** ${forecast.day}`
							)
							.setColor("#CD1C6C")
							.setThumbnail(
								`http://blob.weather.microsoft.com/static/weather4/en-us/law/${forecast.skycodeday}.gif`
							)
							.setFooter({ text: forecast.date });

						if (dif === 1) {
							pages[0] = embed;
						} else if (dif === -1) {
							pages[2] = embed;
						} else if (dif === -2) {
							pages[3] = embed;
						}
					}

					new Paginate.Paginate(client, interaction, pages, 2).init();
				}
			);
		},
	},
};

function checkDay(dif) {
	if (dif > 0) {
		if (dif === 1) {
			return "Yesterday";
		}

		return `${dif} days ago`;
	} else {
		if (dif === -1) {
			return "Tomorrow";
		}

		return `${Math.abs(dif)} more days`;
	}
}
