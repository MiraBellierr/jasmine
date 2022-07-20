const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldMember, newMember) => {
	const logging = client.loggings.get(newMember.guild.id);

	if (!logging || !logging.defaultLogChannel) return;

	if (logging.memberRoleChanges) {
		const newRoles =
			newMember.roles.cache
				.filter((r) => r.id !== newMember.guild.id)
				.map((r) => r)
				.join(", ") || "none";

		const oldRoles =
			oldMember.roles.cache
				.filter((r) => r.id !== oldMember.guild.id)
				.map((r) => r)
				.join(", ") || "none";

		if (newRoles !== oldRoles) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Member Roles Updated",
					iconURL: newMember.user.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Member:** ${newMember}`)
				.addFields([
					{
						name: "Before",
						value: `${oldRoles}`,
					},
					{
						name: "After",
						value: `${newRoles}`,
					},
				])
				.setFooter({ text: `memberid: ${newMember.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.memberLogChannel) {
				logChannel = await newMember.guild.channels.fetch(
					logging.memberLogChannel
				);
			} else {
				logChannel = await newMember.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}
	}

	if (logging.nameChanges) {
		if (newMember.displayName !== oldMember.displayName) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Member Nickname Updated",
					iconURL: newMember.user.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Member:** ${newMember}`)
				.addFields([
					{
						name: "Before",
						value: `${oldMember.displayName}`,
					},
					{
						name: "After",
						value: `${newMember.displayName}`,
					},
				])
				.setFooter({ text: `memberid: ${newMember.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.memberLogChannel) {
				logChannel = await newMember.guild.channels.fetch(
					logging.memberLogChannel
				);
			} else {
				logChannel = await newMember.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}

		if (newMember.user.tag !== oldMember.user.tag) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "User Tag Updated",
					iconURL: newMember.user.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**User:** ${newMember.user}`)
				.addFields([
					{
						name: "Before",
						value: `${oldMember.user.tag}`,
					},
					{
						name: "After",
						value: `${newMember.user.tag}`,
					},
				])
				.setFooter({ text: `memberid: ${newMember.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.memberLogChannel) {
				logChannel = await newMember.guild.channels.fetch(
					logging.memberLogChannel
				);
			} else {
				logChannel = await newMember.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}
	}

	if (logging.avatarChanges) {
		if (newMember.avatar !== oldMember.avatar) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Member Avatar Updated",
					iconURL: newMember.user.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**Member:** ${newMember}`)
				.setThumbnail(newMember.displayAvatarURL())
				.addFields([
					{
						name: "Before",
						value: `[click here](${oldMember.displayAvatarURL({
							size: 4096,
						})})`,
					},
					{
						name: "After",
						value: `[click here](${newMember.displayAvatarURL({
							size: 4096,
						})})`,
					},
				])
				.setFooter({ text: `memberid: ${newMember.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.memberLogChannel) {
				logChannel = await newMember.guild.channels.fetch(
					logging.memberLogChannel
				);
			} else {
				logChannel = await newMember.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}

		if (newMember.user.avatar !== oldMember.user.avatar) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "User Avatar Updated",
					iconURL: newMember.user.displayAvatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(`**User:** ${newMember}`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.addFields([
					{
						name: "Before",
						value: `[click here](${oldMember.user.displayAvatarURL({
							size: 4096,
						})})`,
					},
					{
						name: "After",
						value: `[click here](${newMember.user.displayAvatarURL({
							size: 4096,
						})})`,
					},
				])
				.setFooter({ text: `memberid: ${newMember.id}` })
				.setTimestamp();

			let logChannel;

			if (logging.memberLogChannel) {
				logChannel = await newMember.guild.channels.fetch(
					logging.memberLogChannel
				);
			} else {
				logChannel = await newMember.guild.channels.fetch(
					logging.defaultLogChannel
				);
			}

			logChannel.send({ embeds: [embed] });
		}
	}
};
