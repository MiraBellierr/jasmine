const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldChannel, newChannel) => {
	const logging = client.loggings.get(newChannel.guild.id);

	if (!logging.channelUpdate) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(newChannel.id)) {
			return;
		}
	}

	const differences = Object.keys(oldChannel).filter(
		(key) => oldChannel[key] !== newChannel[key]
	);

	differences.forEach(async (diff) => {
		if (diff !== "permissionOverwrites") {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Channel ${
						diff.charAt(0).toUpperCase() + diff.slice(1)
					} Updated`,
					iconURL: newChannel.guild.iconURL(),
				})
				.setColor("#CD1C6C")
				.addFields([
					{
						name: "Before",
						value: `${oldChannel[diff] ? oldChannel[diff] : "N/A"}`,
					},
					{
						name: "After",
						value: `${newChannel[diff] ? newChannel[diff] : "N/A"}`,
					},
				])
				.setFooter({ text: `channelid: ${newChannel.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.serverLogChannel) {
				logChannel = await newChannel.guild.channels.fetch(
					logging.serverLogChannel
				);
			} else {
				logChannel = await newChannel.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}
	});
};
