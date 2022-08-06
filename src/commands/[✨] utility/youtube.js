const yts = require("yt-search");
const Paginate = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");

module.exports = {
	name: "youtube",
	category: "[✨] utility",
	description: "Search youtube videos",
	usage: "<title>",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		const m = await message.channel.send("*Please wait...*");

		yts(args.join(" "), async (err, res) => {
			if (err) return message.reply("I didn't found a video with that name");

			const pages = [];

			for (let i = 0; i < res.videos.length; i++) {
				const content = `Video ${i + 1}/${res.videos.length}\n${
					res.videos[i].url
				}`;

				pages.push(content);
			}

			m.delete();

			new Paginate.Paginate(client, message, pages).init();
		});
	},
	interaction: {
		data: {
			name: "youtube",
			type: 1,
			description: "Search youtube videos",
			options: [
				{
					name: "title",
					type: 3,
					description: "Title of the video",
					required: true,
				},
			],
		},
		run: async (client, interaction) => {
			interaction.deferReply();

			yts(interaction.options.getString("title"), async (err, res) => {
				if (err)
					return interaction.editReply("I didn't found a video with that name");

				const pages = [];

				for (let i = 0; i < res.videos.length; i++) {
					const content = `Video ${i + 1}/${res.videos.length}\n${
						res.videos[i].url
					}`;

					pages.push(content);
				}

				new Paginate.Paginate(client, interaction, pages).init();
			});
		},
	},
};
