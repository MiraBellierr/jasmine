const { startCollector } = require("../../utils/collectors");
const { getChannelFromArguments } = require("../../utils/getters");
const { MessageEmbed } = require("discord.js");
const { argsError } = require("../../utils/errors");
const Color = require("color");

module.exports = {
	name: "announce",
	category: "[✨] utility",
	description: "Sends an announcement to the channel",
	usage: "<channel>",
	run: async (client, message, args) => {
		if (!message.member.permissions.has("MANAGE_CHANNELS"))
			return message.reply(
				"Sorry, you don't have `MANAGE_CHANNELS` permission to use this command."
			);
		if (!args[0]) return argsError(module.exports, client, message);

		const channel = await getChannelFromArguments(message, args.join(" "));

		if (!channel) return message.reply("Sorry, I couldn't find this channel.");

		if (!message.guild.me.permissionsIn(channel).has("SEND_MESSAGES"))
			return message.reply(
				"I do not have permission in that channel to send an announcement."
			);

		const embed = new MessageEmbed().setDescription("ㅤ");
		let content = `please provide a name for author slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

		const m = await message.reply({
			content,
			embeds: [embed],
		});

		const authorName = await startCollector(message, 256);

		if (authorName.error === "stop")
			return message.reply("I have stopped the command.");

		if (authorName.error !== "skip") {
			if (authorName.error) return message.reply(`Error: ${authorName.error}`);

			embed.setAuthor({ name: authorName.message });
			content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({
				content,
				embeds: [embed],
			});

			const authorIconURL = await startCollector(message);

			if (authorIconURL.error === "stop")
				return message.reply("I have stopped the command.");

			if (authorIconURL.error !== "skip") {
				if (authorIconURL.attachment) {
					embed.setAuthor({
						name: authorName.message,
						iconURL: authorIconURL.attachment,
					});
				} else {
					let authorIconURLText = authorIconURL.message;

					switch (authorIconURL.message) {
						case "{user avatar}":
							authorIconURLText = message.author.displayAvatarURL({
								dynamic: true,
							});
							break;
						case "{kanna avatar}":
							authorIconURLText = client.user.displayAvatarURL();
							break;
						case "{server icon}":
							authorIconURLText = message.guild.iconURL({ dynamic: true });
							break;
					}

					if (
						!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
							authorIconURLText
						)
					)
						return message.channel.send(
							"Invalid input. I have stopped the command"
						);

					embed.setAuthor({
						name: authorName.message,
						iconURL: authorIconURLText,
					});
				}
			}
		}

		content = `please provide a title for title slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const title = await startCollector(message, 256);

		if (title.error === "stop")
			return message.reply("I have stopped the command.");

		if (title.error !== "skip") {
			if (title.error) return message.reply(`"Error: ${title.error}`);

			embed.setTitle(title.message);

			content = `please provide an URL for URL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

			m.edit({
				content,
				embeds: [embed],
			});

			const url = await startCollector(message);

			if (url.error === "stop")
				return message.reply("I have stopped the command.");

			if (url.error !== "skip") {
				if (
					!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
						url.message
					)
				)
					return message.channel.send(
						"Not a well formed URL. I have stopped the command."
					);

				embed.setURL(url.message);
			}
		}

		content = `please provide a description for description slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const description = await startCollector(message, 2048);

		if (description.error === "stop")
			return message.reply("I have stopped the command.");

		if (description.error !== "skip") {
			if (description.error)
				return message.reply(`Error : ${description.error}`);

			embed.setDescription(description.message);
		}

		content = `please provide a text for footer slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const footerText = await startCollector(message, 2048);

		if (footerText.error === "stop")
			return message.reply("I have stopped the command.");

		if (footerText.error !== "skip") {
			if (footerText.error) return message.reply(`Error: ${footerText.error}`);

			embed.setFooter({ text: footerText.message });

			content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({
				content,
				embeds: [embed],
			});

			const footerIconURL = await startCollector(message);

			if (footerIconURL.error === "stop")
				return message.reply("I have stopped the command.");

			if (footerIconURL.error !== "skip") {
				if (footerIconURL.attachment) {
					embed.setFooter({
						text: footerText.message,
						iconURL: footerIconURL.attachment,
					});
				} else {
					let footerIconURLText = footerIconURL.message;

					switch (footerIconURL.message) {
						case "{user avatar}":
							footerIconURLText = message.author.displayAvatarURL({
								dynamic: true,
							});
							break;
						case "{kanna avatar}":
							footerIconURLText = client.user.displayAvatarURL();
							break;
						case "{server icon}":
							footerIconURLText = message.guild.iconURL({ dynamic: true });
							break;
					}

					if (
						!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
							footerIconURLText
						)
					)
						return message.channel.send(
							"Invalid input. I have stopped the command"
						);

					embed.setFooter({
						text: footerText.message,
						iconURL: footerIconURLText,
					});
				}
			}
		}

		content = `please provide a url or attachment for thumbnail slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const thumbnail = await startCollector(message);

		if (thumbnail.error === "stop")
			return message.reply("I have stopped the command.");

		if (thumbnail.error !== "skip") {
			if (thumbnail.attachment) {
				embed.setThumbnail(thumbnail.attachment);
			} else {
				let thumbnailText = thumbnail.message;

				switch (thumbnail.message) {
					case "{user avatar}":
						thumbnailText = message.author.displayAvatarURL({
							dynamic: true,
						});
						break;
					case "{kanna avatar}":
						thumbnailText = client.user.displayAvatarURL();
						break;
					case "{server icon}":
						thumbnailText = message.guild.iconURL({ dynamic: true });
						break;
				}

				if (
					!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
						thumbnailText
					)
				)
					return message.channel.send(
						"Invalid input. I have stopped the command"
					);

				embed.setThumbnail(thumbnailText);
			}
		}

		content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const image = await startCollector(message);

		if (image.error === "stop")
			return message.reply("I have stopped the command.");

		if (image.error !== "skip") {
			if (image.attachment) {
				embed.setImage(image.attachment);
			} else {
				let imageText = image.message;

				switch (image.message) {
					case "{user avatar}":
						imageText = message.author.displayAvatarURL({
							dynamic: true,
						});
						break;
					case "{kanna avatar}":
						imageText = client.user.displayAvatarURL();
						break;
					case "{server icon}":
						imageText = message.guild.iconURL({ dynamic: true });
						break;
				}

				if (
					!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
						imageText
					)
				)
					return message.channel.send(
						"Invalid input. I have stopped the command"
					);

				embed.setImage(imageText);
			}
		}

		content =
			"What color do you want to use for the embed?\n`skip` to skip\n`stop` to stop";

		m.edit({ content, embeds: [embed] });

		const color = await startCollector(message);

		if (color.error === "stop")
			return message.channel.send("I have stopped the command");

		if (color.error !== "skip") {
			const hexColor = Color(color.message.toLowerCase()).hex();

			embed.setColor(hexColor);
		}

		content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const confirmation = await startCollector(message);

		if (confirmation.message === "yes") {
			m.delete();
			channel.send({ embeds: [embed] });

			message.channel.send("I have posted your announcement!");
		} else {
			message.channel.send("I have stopped the command.");
		}
	},
};
