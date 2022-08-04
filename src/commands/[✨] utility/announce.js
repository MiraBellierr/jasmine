const { startCollector } = require("../../utils/collectors");
const { getChannelFromArguments } = require("../../utils/getters");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { argsError } = require("../../utils/errors");
const Color = require("color");
const { checkIfImage } = require("../../utils/utils");
const validURL = require("valid-url");

module.exports = {
	name: "announce",
	category: "[✨] utility",
	description: "Sends an announcement to the channel",
	memberPermission: "ManageChannels",
	usage: "<channel>",
	run: async (client, message, args) => {
		if (!args[0]) return argsError(module.exports, client, message);

		const channel = await getChannelFromArguments(message, args.join(" "));

		if (!channel) return message.reply("Sorry, I couldn't find this channel.");

		if (
			!message.guild.members.me
				.permissionsIn(channel)
				.has(PermissionsBitField.Flags.SendMessages)
		)
			return message.reply(
				"I do not have permission in that channel to send an announcement."
			);

		const embed = new EmbedBuilder().setDescription("ㅤ");
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
			content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({
				content,
				embeds: [embed],
			});

			const authorIconURL = await startCollector(message);

			if (authorIconURL.error === "stop")
				return message.reply("I have stopped the command.");

			if (authorIconURL.error !== "skip") {
				if (authorIconURL.attachment) {
					if (!(await checkIfImage(authorIconURL.attachment))) {
						return message.reply("That's not an image.");
					}

					embed.setAuthor({
						name: authorName.message,
						iconURL: authorIconURL.attachment,
					});
				} else {
					let authorIconURLText = authorIconURL.message;

					switch (authorIconURL.message) {
						case "{user avatar}":
							authorIconURLText = message.author.displayAvatarURL();
							break;
						case "{jasmine avatar}":
							authorIconURLText = client.user.displayAvatarURL();
							break;
						case "{server icon}":
							authorIconURLText = message.guild.iconURL();
							break;
					}

					if (!(await checkIfImage(authorIconURLText))) {
						return message.reply("That's not an image.");
					}

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
				if (!validURL.isUri(url.message))
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

			content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({
				content,
				embeds: [embed],
			});

			const footerIconURL = await startCollector(message);

			if (footerIconURL.error === "stop")
				return message.reply("I have stopped the command.");

			if (footerIconURL.error !== "skip") {
				if (footerIconURL.attachment) {
					if (!(await checkIfImage(footerIconURL.attachment))) {
						return message.reply("That's not an image.");
					}

					embed.setFooter({
						text: footerText.message,
						iconURL: footerIconURL.attachment,
					});
				} else {
					let footerIconURLText = footerIconURL.message;

					switch (footerIconURL.message) {
						case "{user avatar}":
							footerIconURLText = message.author.displayAvatarURL();
							break;
						case "{jasmine avatar}":
							footerIconURLText = client.user.displayAvatarURL();
							break;
						case "{server icon}":
							footerIconURLText = message.guild.iconURL();
							break;
					}

					if (!(await checkIfImage(footerIconURLText))) {
						return message.reply("That's not an image.");
					}

					embed.setFooter({
						text: footerText.message,
						iconURL: footerIconURLText,
					});
				}
			}
		}

		content = `please provide a url or attachment for thumbnail slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const thumbnail = await startCollector(message);

		if (thumbnail.error === "stop")
			return message.reply("I have stopped the command.");

		if (thumbnail.error !== "skip") {
			if (thumbnail.attachment) {
				if (!(await checkIfImage(thumbnail.attachment))) {
					return message.reply("That's not an image.");
				}

				embed.setThumbnail(thumbnail.attachment);
			} else {
				let thumbnailText = thumbnail.message;

				switch (thumbnail.message) {
					case "{user avatar}":
						thumbnailText = message.author.displayAvatarURL();
						break;
					case "{jasmine avatar}":
						thumbnailText = client.user.displayAvatarURL();
						break;
					case "{server icon}":
						thumbnailText = message.guild.iconURL();
						break;
				}

				if (!(await checkIfImage(thumbnailText))) {
					return message.reply("That's not an image.");
				}

				embed.setThumbnail(thumbnailText);
			}
		}

		content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

		m.edit({
			content,
			embeds: [embed],
		});

		const image = await startCollector(message);

		if (image.error === "stop")
			return message.reply("I have stopped the command.");

		if (image.error !== "skip") {
			if (image.attachment) {
				if (!(await checkIfImage(image.attachment))) {
					return message.reply("That's not an image.");
				}

				embed.setImage(image.attachment);
			} else {
				let imageText = image.message;

				switch (image.message) {
					case "{user avatar}":
						imageText = message.author.displayAvatarURL();
						break;
					case "{jasmine avatar}":
						imageText = client.user.displayAvatarURL();
						break;
					case "{server icon}":
						imageText = message.guild.iconURL();
						break;
				}

				if (!(await checkIfImage(imageText))) {
					return message.reply("That's not an image.");
				}

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
