const { EmbedBuilder } = require("discord.js");

module.exports = async (client, channel) => {
	const logging = client.loggings.get(channel.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.channelDeletion) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(channel.id)) {
			return;
		}
	}

	const embed = new EmbedBuilder()
		.setAuthor({
			name: "Channel Deleted",
			iconURL: channel.guild.iconURL(),
		})
		.setColor("#CD1C6C")
		.setDescription(`**Channel:** #${channel.name}`)
		.setFooter({ text: `channelid: ${channel.id}` })
		.setTimestamp();

	let logChannel;

	if (logging.serverLogChannel) {
		logChannel = await channel.guild.channels.fetch(logging.serverLogChannel);
	} else {
		logChannel = await channel.guild.channels.fetch(logging.defaultLogChannel);
	}

	logChannel.send({ embeds: [embed] });
};
