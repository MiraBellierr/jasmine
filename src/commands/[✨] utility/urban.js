const Discord = require("discord.js");
const ud = require("urban-dictionary");
const Paginate = require("../../utils/pagination");
const Error = require("../../utils/Error");
const badwords = require("../../database/json/badwords.json");

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
					const definition = filter(
						result[i].definition.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
					);

					const example = filter(
						result[i].example.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
					);

					const embed = new Discord.MessageEmbed()
						.setAuthor({
							name: message.author.username,
							iconURL: message.author.displayAvatarURL({ forceStatic: false }),
						})
						.setTitle(result[i].word)
						.setURL(result[i].permalink)
						.setColor("#CD1C6C")
						.setDescription(Discord.Util.escapeMarkdown(definition))
						.addField("example", `${Discord.Util.escapeMarkdown(example)}`)
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
			async () => {
				message.reply("I can't find the urban definition for that word");
			}
		);
	},
};

function filter(words) {
	let filtered = words;

	for (const badword of badwords) {
		filtered = filtered.replace(badword, "*".repeat(badword.length));
		filtered = filtered.replace(
			badword.toUpperCase(),
			"*".repeat(badword.length)
		);
	}

	return filtered;
}
