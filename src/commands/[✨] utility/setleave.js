const { getChannelFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const schemas = require("../../database/schemas");
const { startCollector } = require("../../utils/collectors");
const { MessageEmbed } = require("discord.js");
const Color = require("color");

module.exports = {
	name: "setleave",
	aliases: ["sl"],
	category: "[✨] utility",
	description: "Leave message configuration",
	memberPermissions: "MANAGE_CHANNELS",
	usage: "<channel | on | off>",
	run: async (client, message, args) => {
		if (!message.member.permissions.has("MANAGE_CHANNELS"))
			return message.channel.send(
				"Sorry, you don't have manage channels permission to use this command."
			);

		if (!args.length) return argsError(module.exports, client, message);

		const arg = args.join(" ");
		const LeaveMessage = schemas.leaveMessage();

		if (arg === "on") {
			const leaveMessage = await LeaveMessage.findOne({
				where: { guildID: message.guild.id },
			});

			if (!leaveMessage)
				return message.channel.send("You haven't set up a leave message yet.");

			LeaveMessage.update(
				{ switch: true },
				{ where: { guildID: message.guild.id } }
			);

			const leaveObj = client.leaves.get(message.guild.id);

			leaveObj.switch = true;

			client.leaves.set(message.guild.id, leaveObj);

			message.channel.send("Leave message has been turned on");
		} else if (arg === "off") {
			const leaveMessage = await LeaveMessage.findOne({
				where: { guildID: message.guild.id },
			});

			if (!leaveMessage)
				return message.channel.send("You haven't set up a leave message yet.");

			LeaveMessage.update(
				{ switch: false },
				{ where: { guildID: message.guild.id } }
			);

			const leaveObj = client.leaves.get(message.guild.id);

			leaveObj.switch = false;

			client.leaves.set(message.guild.id, leaveObj);

			message.channel.send("Leave message has been turned off");
		} else {
			const channel = await getChannelFromArguments(message, arg);

			if (!channel) return argsError(module.exports, client, message);

			if (!message.guild.me.permissionsIn(channel).has("SEND_MESSAGES"))
				return message.channel.send(
					"I do not have a permission to send a message in that channel"
				);

			if (channel.type !== "GUILD_TEXT")
				return message.channel.send("Only guild text channel is accepted");

			const leaveObj = {
				channelID: channel.id,
				switch: false,
				authorName: null,
				authorURL: null,
				title: null,
				titleURL: null,
				thumbnail: null,
				description: null,
				image: null,
				footerText: null,
				footerURL: null,
				color: null,
			};

			const embed = new MessageEmbed().setDescription("ㅤ");
			let content = `Please provide a name for \`author\` slot\n\`skip\` to skip\n\`stop\` to stop\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nChannel: ${channel}`;

			const m = await message.channel.send({ content, embeds: [embed] });

			const authorName = await startCollector(message, 256);

			if (authorName.error === "stop")
				return message.channel.send("I have stopped the command");

			if (authorName.error !== "skip") {
				if (authorName.error)
					return message.channel.send(`Error: ${authorName.error}`);

				const authorNameEmbed = authorName.message
					.replace("{username}", message.author.username)
					.replace("{tag}", message.author.tag)
					.replace("{server}", message.guild.name)
					.replace("{membercount}", message.guild.memberCount);

				embed.setAuthor({ name: authorNameEmbed });

				leaveObj.authorName = authorName.message;

				content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nChannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const authorURL = await startCollector(message);

				if (authorURL.error === "stop")
					return message.channel.send("I have stopped the command");

				if (authorURL.error !== "skip") {
					if (authorURL.attachment) {
						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURL.attachment,
						});

						leaveObj.authorURL = authorURL.attachment;
					} else {
						let authorURLText = authorURL.message;

						switch (authorURL.message) {
							case "{user avatar}":
								authorURLText = message.author.displayAvatarURL({
									dynamic: true,
								});
								break;
							case "{kanna avatar}":
								authorURLText = client.user.displayAvatarURL();
								break;
							case "{server icon}":
								authorURLText = message.guild.iconURL({ dynamic: true });
								break;
						}

						if (
							!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
								authorURLText
							)
						)
							return message.channel.send(
								"Invalid input. I have stopped the command"
							);

						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURLText,
						});

						leaveObj.authorURL = authorURL.message;
					}
				}
			}

			content = `please provide a title for title slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count'\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const title = await startCollector(message, 256);

			if (title.error === "stop")
				return message.channel.send("I have stopped the command");

			if (title.error !== "skip") {
				if (title.error) return message.channel.send(`Error: ${title.error}`);

				const titleEmbed = title.message
					.replace("{username}", message.author.username)
					.replace("{tag}", message.author.tag)
					.replace("{server}", message.guild.name)
					.replace("{membercount}", message.guild.memberCount);

				embed.setTitle(titleEmbed);

				leaveObj.title = title.message;

				content = `please provide an URL for URL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const titleURL = await startCollector(message);

				if (titleURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (titleURL.error !== "skip") {
					if (
						!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
							titleURL.message
						)
					)
						return message.channel.send(
							"Not a well formed URL. I have stopped the command."
						);

					embed.setURL(titleURL.message);

					leaveObj.titleURL = titleURL.message;
				}
			}

			content = `please provide a description for description slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{mention}\` - a mention of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const description = await startCollector(message, 2048);

			if (description.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (description.error !== "skip") {
				if (description.error)
					return message.channel.send(`Error : ${description.error}`);

				const descriptionEmbed = description.message
					.replace("{username}", message.author.username)
					.replace("{tag}", message.author.tag)
					.replace("{mention}", message.author)
					.replace("{server}", message.guild.name)
					.replace("{membercount}", message.guild.memberCount);

				embed.setDescription(descriptionEmbed);

				leaveObj.description = description.message;
			}

			content = `please provide a text for footer slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const footerText = await startCollector(message, 2048);

			if (footerText.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (footerText.error !== "skip") {
				if (footerText.error)
					return message.channel.send(`Error: ${footerText.error}`);

				const footerEmbed = footerText.message
					.replace("{username}", message.author.username)
					.replace("{tag}", message.author.tag)
					.replace("{server}", message.guild.name)
					.replace("{membercount}", message.guild.memberCount);

				embed.setFooter({ text: footerEmbed });

				leaveObj.footerText = footerText.message;

				content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const footerURL = await startCollector(message);

				if (footerURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (footerURL.error !== "skip") {
					if (footerURL.attachment) {
						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURL.attachment,
						});

						leaveObj.footerURL = footerURL.attachment;
					} else {
						let footerURLText = footerURL.message;

						switch (footerURL.message) {
							case "{user avatar}":
								footerURLText = message.author.displayAvatarURL({
									dynamic: true,
								});
								break;
							case "{kanna avatar}":
								footerURLText = client.user.displayAvatarURL();
								break;
							case "{server icon}":
								footerURLText = message.guild.iconURL({ dynamic: true });
								break;
						}

						if (
							!/(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gims.test(
								footerURLText
							)
						)
							return message.channel.send(
								"Invalid input. I have stopped the command"
							);

						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURLText,
						});

						leaveObj.footerURL = footerURL.message;
					}
				}
			}

			content = `please provide a url or attachment for thumbnail slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const thumbnail = await startCollector(message);

			if (thumbnail.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (thumbnail.error !== "skip") {
				if (thumbnail.attachment) {
					embed.setThumbnail(thumbnail.attachment);

					leaveObj.thumbnail = thumbnail.attachment;
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

					leaveObj.thumbnail = thumbnail.message;
				}
			}

			content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const image = await startCollector(message);

			if (image.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (image.error !== "skip") {
				if (image.attachment) {
					embed.setImage(image.attachment);

					leaveObj.image = image.attachment;
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

					leaveObj.image = image.message;
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

				leaveObj.color = hexColor;
			}

			content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const confirmation = await startCollector(message);

			if (confirmation.message === "yes") {
				try {
					await LeaveMessage.create({
						guildID: message.guild.id,
						channelID: channel.id,
						switch: false,
						authorName: leaveObj.authorName,
						authorURL: leaveObj.authorURL,
						title: leaveObj.title,
						titleURL: leaveObj.titleURL,
						thumbnail: leaveObj.thumbnail,
						description: leaveObj.description,
						image: leaveObj.image,
						footerText: leaveObj.footerText,
						footerURL: leaveObj.footerURL,
						color: leaveObj.color,
					});
				} catch {
					await LeaveMessage.update(
						{
							channelID: channel.id,
							switch: false,
							authorName: leaveObj.authorName,
							authorURL: leaveObj.authorURL,
							title: leaveObj.title,
							titleURL: leaveObj.titleURL,
							thumbnail: leaveObj.thumbnail,
							description: leaveObj.description,
							image: leaveObj.image,
							footerText: leaveObj.footerText,
							footerURL: leaveObj.footerURL,
							color: leaveObj.color,
						},
						{ where: { guildID: message.guild.id } }
					);
				}

				client.leaves.set(message.guild.id, leaveObj);

				message.channel.send(
					`Leave message has been set! Type \`${client.prefixes.get(
						message.guild.id
					)}${module.exports.name} on\` to turn on the leave message`
				);
			} else {
				message.channel.send("I have stopped the command.");
			}
		}
	},
};
