const gis = require("g-i-s");
const Discord = require("discord.js");
const { Paginate } = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");

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

		if (!args.length) return argsError(module.exports, client, message);

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

			for (let i = 0; i < res.length; i++) {
				const values = new Discord.EmbedBuilder()
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
	interaction: {
		data: {
			name: "searchimage",
			type: 1,
			description: "Search images",
			options: [
				{
					name: "image",
					type: 3,
					description: "The image to search",
					required: true,
				},
			],
		},
		run: async (client, interaction) => {
			if (!interaction.channel.nsfw)
				return interaction.reply(
					"This command can be used in nsfw channel only."
				);

			interaction.deferReply();

			const search = interaction.options.getString("image");

			const opts = {
				searchTerm: search,
				queryStringAddition: "&tbs=ic",
				filterOutDomains: ["lookaside.fbsbx.com"],
			};

			gis(opts, async (err, res) => {
				if (err)
					return interaction.editReply("I couldn't found that image, sorry!");

				const title = capitalize(search);
				const pages = [];

				for (let i = 0; i < res.length; i++) {
					const values = new Discord.EmbedBuilder()
						.setTitle(title)
						.setColor("#CD1C6C")
						.setImage(res[i].url)
						.setFooter({ text: `Page ${i + 1}/${res.length}` });

					pages.push(values);
				}

				new Paginate(client, interaction, pages).init();
			});
		},
	},
};
