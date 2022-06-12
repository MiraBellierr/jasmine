const Discord = require("discord.js");
const Getter = require("../../utils/Getter");
const Util = require("../../utils/Util");

module.exports = {
	name: "whois",
	aliases: ["userinfo", "user"],
	description: "shows user and member information",
	category: "[📚] info",
	usage: "[user]",
	run: async (client, message, args) => {
		const user =
			(await new Getter(message, args.join(" ")).getUser(client)) ||
			message.author;

		const created = new Util().formatDate(user.createdTimestamp);

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setColor("#CD1C6C")
			.addField(
				"User Information:",
				`**• Avatar URL:** [Link](${user.displayAvatarURL({
					dynamic: true,
					size: 4096,
				})})\n**• ID:** ${user.id}\n**• Discriminator:** ${
					user.discriminator
				}\n**• Username**: ${user.username}\n**• Tag:** ${
					user.tag
				}\n**• Mention:** ${user}\n**• Account Type:** ${
					user.bot ? "Bot" : "Human"
				}\n**• Account created at**: ${created}`,
				true
			);

		try {
			const member = await message.guild.members.fetch(user.id);

			const premiumSince = new Util().formatDate(member.premiumSince);
			const joined = new Util().formatDate(member.joinedAt);
			const roles =
				member.roles.cache
					.filter((r) => r.id !== message.guild.id)
					.sort((a, b) => b.position - a.position)
					.map((r) => r)
					.join(", ") || "None";

			embed.setColor(
				member.displayHexColor === "#000000"
					? "#CD1C6C"
					: member.displayHexColor
			);
			embed.addField(
				"Member Information:",
				`**• Nickname:** ${
					member.nickname === null ? "None" : member.nickname
				}\n**• Display Name:** ${
					member.displayName
				}\n**• Display Hex Color:** ${member.displayHexColor.toUpperCase()}\n**• Manageable by this bot:** ${
					member.manageable ? "Yes" : "No"
				}\n**• bannable by this bot:** ${
					member.bannable ? "Yes" : "No"
				}\n**• Kickable by this bot:** ${
					member.kickable ? "Yes" : "No"
				}\n**• Nitro Booster Since:** ${
					member.premiumSince === null ? "Not a Nitro Booster" : premiumSince
				}\n**• Joined At:** ${joined}`,
				true
			);
			embed.addField("**Roles**", roles);
		} catch {}

		message.reply({ embeds: [embed] });
	},
};
