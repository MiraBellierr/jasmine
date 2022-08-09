const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldChannel, newChannel) => {
	const logging = client.loggings.get(newChannel.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.channelUpdate) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(newChannel.id)) {
			return;
		}
	}

	const differences = Object.keys(oldChannel).filter(
		(key) =>
			oldChannel[key] !== newChannel[key] && typeof newChannel[key] !== "object"
	);

	differences.forEach(async (diff) => {
		if (diff === "rawPosition") return;

		let embed;

		if (diff === "parentId") {
			const oldCategory = await client.channels.fetch(oldChannel[diff]);
			const newCategory = await client.channels.fetch(newChannel[diff]);

			embed = new EmbedBuilder()
				.setAuthor({
					name: "Channel category Updated",
					iconURL: newChannel.guild.iconURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Channel Name:** ${newChannel.name}`)
				.addFields([
					{
						name: "Before",
						value: `${oldCategory}`,
					},
					{
						name: "After",
						value: `${newCategory}`,
					},
				])
				.setFooter({ text: `channelid: ${newChannel.id}` })
				.setTimestamp();
		} else {
			embed = new EmbedBuilder()
				.setAuthor({
					name: `Channel ${diff
						.replace(/([A-Z])/g, " $1")
						.toLowerCase()} Updated`,
					iconURL: newChannel.guild.iconURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Channel:** ${newChannel}`)
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
		}

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
	});
};
