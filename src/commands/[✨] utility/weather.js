const Discord = require("discord.js");
const w = require("weather-js2");
const Error = require("../../utils/Error");
const Paginate = require("../../utils/pagination");

module.exports = {
	name: "weather",
	description: "Send an information about a weather",
	category: "[✨] utility",
	usage: "<location>",
	run: async (client, message, args) => {
		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		w.find(
			{ search: args.join(" "), degreeType: "C", resCount: 1 },
			(err, results) => {
				if (err) return console.log(err);

				const result = results[0];
				const currentDay = result.current.date.slice(8);

				const current = new Discord.MessageEmbed()
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

				pages[2] = current;

				for (let i = 0; i < forecasts.length; i++) {
					const forecast = forecasts[i];
					const dif = parseInt(currentDay - forecast.date.slice(8));

					if (dif === 0) continue;

					const day = checkDay(dif);

					const embed = new Discord.MessageEmbed()
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
						pages[1] = embed;
					} else if (dif === 2) {
						pages[0] = embed;
					} else if (dif === -1) {
						pages[3] = embed;
					} else if (dif === -2) {
						pages[4] = embed;
					}
				}

				new Paginate.Paginate(client, message, pages, 3).init();
			}
		);
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
