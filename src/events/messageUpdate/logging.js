const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldMessage, newMessage) => {
	if (newMessage.author.bot) return;

	const logging = client.loggings.get(newMessage.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.messageEdit) return;

	if (logging.ignoredChannels) {
		const ignoredChannels = logging.ignoredChannels.split("|");

		if (ignoredChannels.includes(newMessage.channel.id)) {
			return;
		}
	}

	if (oldMessage.cleanContent !== newMessage.cleanContent) {
		try {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Message Edited`,
					iconURL: newMessage.author.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Member:** ${newMessage.member}`)
				.addFields([
					{
						name: "Before",
						value: `${oldMessage.cleanContent}`,
					},
					{
						name: "After",
						value: `${newMessage.cleanContent}`,
					},
				])
				.setFooter({ text: `messageid: ${newMessage.id}` })
				.setTimestamp();

			const logChannel = await newMessage.guild.channels.fetch(
				logging.defaultLogChannel
			);

			logChannel.send({ embeds: [embed] });
		} catch {
			return null;
		}
	}
};
