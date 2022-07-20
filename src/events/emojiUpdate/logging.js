const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldEmoji, newEmoji) => {
	const logging = client.loggings.get(newEmoji.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.emojiAndStickerChanges) return;

	const differences = Object.keys(oldEmoji).filter(
		(key) =>
			oldEmoji[key] !== newEmoji[key] && typeof newEmoji[key] !== "object"
	);

	differences.forEach(async (diff) => {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: `Emoji ${diff.charAt(0).toUpperCase() + diff.slice(1)} Updated`,
				iconURL: newEmoji.guild.iconURL(),
			})
			.setColor("#CD1C6C")
			.addFields([
				{
					name: "Before",
					value: `${oldEmoji[diff] ? oldEmoji[diff] : "N/A"}`,
				},
				{
					name: "After",
					value: `${newEmoji[diff] ? newEmoji[diff] : "N/A"}`,
				},
			])
			.setFooter({ text: `emojiid: ${newEmoji.id}` })
			.setTimestamp();

		let logChannel;

		if (logging.serverLogChannel) {
			logChannel = await newEmoji.guild.channels.fetch(
				logging.serverLogChannel
			);
		} else {
			logChannel = await newEmoji.guild.channels.fetch(
				logging.defaultLogChannel
			);
		}

		logChannel.send({ embeds: [embed] });
	});
};
