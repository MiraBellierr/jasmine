const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldGuild, newGuild) => {
	const logging = client.loggings.get(newGuild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (!logging.serverUpdate) return;

	const differences = Object.keys(oldGuild).filter(
		(key) =>
			oldGuild[key] !== newGuild[key] && typeof oldGuild[key] !== "object"
	);

	differences.forEach(async (diff) => {
		if (diff === "banner") {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Server banner Updated",
					iconURL: newGuild.iconURL(),
				})
				.setColor("#CD1C6C")
				.addFields([
					{
						name: "Before",
						value: oldGuild.bannerURL()
							? `[click here](${oldGuild.bannerURL({ size: 4096 })})`
							: "N/A",
					},
					{
						name: "After",
						value: newGuild.bannerURL()
							? `[click here](${newGuild.bannerURL({ size: 4096 })})`
							: "N/A",
					},
				])
				.setFooter({ text: `serverid: ${newGuild.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.serverLogChannel) {
				logChannel = await newGuild.channels.fetch(logging.serverLogChannel);
			} else {
				logChannel = await newGuild.channels.fetch(logging.defaultLogChannel);
			}

			logChannel.send({ embeds: [embed] });
		} else if (diff === "icon") {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Server icon Updated",
					iconURL: newGuild.iconURL(),
				})
				.setColor("#CD1C6C")
				.addFields([
					{
						name: "Before",
						value: oldGuild.iconURL()
							? `[click here](${oldGuild.iconURL({ size: 4096 })})`
							: "N/A",
					},
					{
						name: "After",
						value: newGuild.iconURL()
							? `[click here](${newGuild.iconURL({ size: 4096 })})`
							: "N/A",
					},
				])
				.setFooter({ text: `serverid: ${newGuild.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.serverLogChannel) {
				logChannel = await newGuild.channels.fetch(logging.serverLogChannel);
			} else {
				logChannel = await newGuild.channels.fetch(logging.defaultLogChannel);
			}

			logChannel.send({ embeds: [embed] });
		} else {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Server ${
						diff.charAt(0).toUpperCase() + diff.slice(1)
					} Updated`,
					iconURL: newGuild.iconURL(),
				})
				.setColor("#CD1C6C")
				.addFields([
					{
						name: "Before",
						value: `${oldGuild[diff] ? oldGuild[diff] : "N/A"}`,
					},
					{
						name: "After",
						value: `${newGuild[diff] ? newGuild[diff] : "N/A"}`,
					},
				])
				.setFooter({ text: `serverid: ${newGuild.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.serverLogChannel) {
				logChannel = await newGuild.channels.fetch(logging.serverLogChannel);
			} else {
				logChannel = await newGuild.channels.fetch(logging.defaultLogChannel);
			}

			logChannel.send({ embeds: [embed] });
		}
	});
};
