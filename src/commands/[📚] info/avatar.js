const { MessageEmbed } = require("discord.js");
const Getter = require("../../utils/Getter");

module.exports = {
	name: "avatar",
	aliases: ["av"],
	category: "[📚] info",
	description: "Shows user avatar",
	usage: "[user]",
	run: async (client, message, args) => {
		const user =
			(await new Getter(message, args.join(" ")).getUser(client)) ||
			message.author;

		const embed = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setTitle(`${user.username}'s avatar`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.displayAvatarURL({
					extension: "webp",
				})}) | [png](${user.displayAvatarURL({
					extension: "png",
				})}) | [jpg](${user.displayAvatarURL({
					extension: "jpg",
				})}) | [jpeg](${user.displayAvatarURL({
					extension: "jpeg",
				})}) | [gif](${user.displayAvatarURL({
					extension: "gif",
					forceStatic: false,
				})})`
			)
			.setImage(user.displayAvatarURL({ forceStatic: false, size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		message.reply({ embeds: [embed] });
	},
};
