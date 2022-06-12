const Discord = require("discord.js");
const Paginate = require("../../utils/pagination");

module.exports = {
	name: "servericon",
	aliases: ["si"],
	category: "[📚] info",
	description: "Returns server icon",
	run: (client, message) => {
		if (!message.guild.iconURL())
			return message.reply("This server doesn't have a server icon");

		const pages = [];

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setTitle("Server Icon")
			.setColor("#CD1C6C")
			.setImage(message.guild.iconURL({ dynamic: true, size: 4096 }))
			.setTimestamp()
			.setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

		pages.push(embed);

		if (message.guild.bannerURL()) {
			const banner = new Discord.MessageEmbed()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL({ dynamic: true }),
				})
				.setTitle("Server Banner")
				.setColor("#CD1C6C")
				.setImage(message.guild.bannerURL({ dynamic: true, size: 4096 }))
				.setTimestamp()
				.setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

			pages.push(banner);
		}

		new Paginate.Paginate(client, message, pages).init();
	},
};
