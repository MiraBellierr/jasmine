const { MessageEmbed } = require("discord.js");

module.exports = {
	name: "ping",
	category: "[✨] utility",
	description: "Returns latency and API ping",
	run: async (client, message) => {
		const msg = await message.reply("🏓 Pinging....");

		const embed = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setColor("#CD1C6C")
			.setTitle("🏓 Pong")
			.addField(
				"Latency",
				`${Math.floor(msg.createdTimestamp - message.createdTimestamp)}ms`
			)
			.addField("API Latency", `${Math.round(client.ws.ping)}ms`)
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.avatarURL({ dynamic: true }),
			});

		message.reply({ embeds: [embed] });

		msg.delete();
	},
};
