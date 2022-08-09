const { EmbedBuilder } = require("discord.js");
const Color = require("color");

module.exports = async (client, oldRole, newRole) => {
	const logging = client.loggings.get(newRole.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.roleUpdate) return;

	const differences = Object.keys(oldRole).filter(
		(key) => oldRole[key] !== newRole[key] && typeof oldRole[key] !== "object"
	);

	differences.forEach(async (diff) => {
		if (diff === "rawPosition") return;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `Role ${
					diff
						.replace(/([A-Z])/g, " $1")
						.charAt(0)
						.toUpperCase() + diff.replace(/([A-Z])/g, " $1").slice(1)
				} Updated`,
				iconURL: newRole.guild.iconURL(),
			})
			.setColor("#CD1C6C")
			.setDescription(`**Role:** ${newRole}`)
			.addFields([
				{
					name: "Before",
					value: `${
						oldRole[diff]
							? diff === "color"
								? Color(oldRole[diff]).hex().toUpperCase()
								: oldRole[diff]
							: "N/A"
					}`,
				},
				{
					name: "After",
					value: `${
						newRole[diff]
							? diff === "color"
								? Color(newRole[diff]).hex().toUpperCase()
								: newRole[diff]
							: "N/A"
					}`,
				},
			])
			.setFooter({ text: `channelid: ${newRole.id}` })
			.setTimestamp();

		let logChannel;

		if (logging.serverLogChannel) {
			logChannel = await newRole.guild.channels.fetch(logging.serverLogChannel);
		} else {
			logChannel = await newRole.guild.channels.fetch(
				logging.defaultLogChannel
			);
		}
		logChannel.send({ embeds: [embed] });
	});
};
