const { EmbedBuilder } = require("discord.js");

module.exports = async (client, messages, channel) => {
	const logging = client.loggings.get(channel.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.messagePurge) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(channel.id)) {
			return;
		}
	}

	const embed = new EmbedBuilder()
		.setAuthor({
			name: "Message Bulk Deleted",
			iconURL: channel.guild.iconURL(),
		})
		.setColor("#CD1C6C")
		.setDescription(
			`**Channel:** ${channel}\n**Messages:** ${messages.size} messages`
		)
		.setTimestamp();

	let logChannel = await channel.guild.channels.fetch(
		logging.defaultLogChannel
	);

	logChannel.send({ embeds: [embed] });
};
