const Discord = require("discord.js");
const ud = require("urban-dictionary");
const Paginate = require("../../utils/pagination");
const Error = require("../../utils/Error");

module.exports = {
	name: "urban",
	aliases: ["ud"],
	description: "Send an urban definition about a word",
	category: "[✨] utility",
	usage: "<word>",
	run: async (client, message, args) => {
		if (!args.length)
			return new Error(module.exports, client, message).argsError();

		ud.define(args.join(" ")).then(
			async (result) => {
				const pages = [];

				for (let i = 0; i < result.length; i++) {
					const embed = new Discord.MessageEmbed()
						.setAuthor({
							name: message.author.username,
							iconURL: message.author.displayAvatarURL({ forceStatic: false }),
						})
						.setTitle(result[i].word)
						.setURL(result[i].permalink)
						.setColor("#CD1C6C")
						.setDescription(
							result[i].definition.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
						)
						.addField(
							"example",
							`${result[i].example
								.replace(/[\[+]/gm, "")
								.replace(/[\]+]/gm, "")}`
						)
						.addField("Upvotes", `${result[i].thumbs_up}`, true)
						.setFooter({
							text: `Written by ${result[i].author} | Page ${i + 1}/${
								result.length
							}`,
						})
						.setTimestamp();

					pages.push(embed);
				}

				new Paginate.Paginate(client, message, pages).init();
			},
			async (error) => {
				message.reply("I can't find the urban definition for that word");
			}
		);
	},
};
