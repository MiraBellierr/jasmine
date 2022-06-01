const gis = require("g-i-s");
const Discord = require("discord.js");
const { Paginate } = require("../../utils/pagination");
const Error = require("../../utils/Error");

function capitalize(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

module.exports = {
	name: "searchimage",
	aliases: ["image", "img"],
	category: "[✨] utility",
	description: "Search images",
	usage: "<image to search>",
	run: async (client, message, args) => {
		if (!message.channel.nsfw)
			return message.channel.send(
				"This command can be used in nsfw channel only."
			);

		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		const m = await message.channel.send("*Please wait...*");
		const search = args.join(" ");

		const opts = {
			searchTerm: search,
			queryStringAddition: "&tbs=ic",
			filterOutDomains: ["lookaside.fbsbx.com"],
		};

		gis(opts, async (err, res) => {
			if (err)
				return message.channel.send("I couldn't found that image, sorry!");

			const title = capitalize(search);
			const pages = [];

			console.log(res);

			for (let i = 0; i < res.length; i++) {
				const values = new Discord.MessageEmbed()
					.setTitle(title)
					.setColor("#CD1C6C")
					.setImage(res[i].url)
					.setFooter({ text: `Page ${i + 1}/${res.length}` });

				pages.push(values);
			}

			new Paginate(client, message, pages).init();

			m.delete();
		});
	},
};
