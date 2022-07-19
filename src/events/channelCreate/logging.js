const { EmbedBuilder } = require("discord.js");

module.exports = async (client, channel) => {
	const logging = client.loggings.get(channel.guild.id);

	if (!logging.channelCreation) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(channel.id)) {
			return;
		}
	}

	const embed = new EmbedBuilder()
		.setAuthor({
			name: "Channel Created",
			iconURL: channel.guild.iconURL(),
		})
		.setColor("#CD1C6C")
		.setDescription(`Channel: ${channel}`)
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
