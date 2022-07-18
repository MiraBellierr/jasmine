const { getChannelFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const schemas = require("../../database/schemas");
const { startCollector } = require("../../utils/collectors");
const {
	EmbedBuilder,
	PermissionsBitField,
	ChannelType,
} = require("discord.js");
const Color = require("color");
const { checkIfImage } = require("../../utils/utils");
const validURL = require("valid-url");

module.exports = {
	name: "setwelcome",
	aliases: ["sw"],
	category: "[✨] utility",
	description: "Welcome message configuration",
	memberPermissions: PermissionsBitField.Flags.ManageChannels,
	usage: "<channel | on | off>",
	run: async (client, message, args) => {
		if (!args.length) return argsError(module.exports, client, message);

		const arg = args.join(" ");
		const WelcomeMessage = schemas.welcomeMessage();

		if (arg === "on") {
			const welcomeMessage = await WelcomeMessage.findOne({
				where: { guildID: message.guild.id },
			});

			if (!welcomeMessage)
				return message.channel.send(
					"You haven't set up a welcome message yet."
				);

			WelcomeMessage.update(
				{ switch: true },
				{ where: { guildID: message.guild.id } }
			);

			const welcomeObj = client.welcomes.get(message.guild.id);

			welcomeObj.switch = true;

			client.welcomes.set(message.guild.id, welcomeObj);

			message.channel.send("Welcome message has been turned on");
		} else if (arg === "off") {
			const welcomeMessage = await WelcomeMessage.findOne({
				where: { guildID: message.guild.id },
			});

			if (!welcomeMessage)
				return message.channel.send(
					"You haven't set up a welcome message yet."
				);

			WelcomeMessage.update(
				{ switch: false },
				{ where: { guildID: message.guild.id } }
			);

			const welcomeObj = client.welcomes.get(message.guild.id);

			welcomeObj.switch = false;

			client.welcomes.set(message.guild.id, welcomeObj);

			message.channel.send("Welcome message has been turned off");
		} else {
			const channel = await getChannelFromArguments(message, arg);

			if (!channel) return argsError(module.exports, client, message);

			if (
				!message.guild.members.me
					.permissionsIn(channel)
					.has(PermissionsBitField.Flags.SendMessages)
			)
				return message.channel.send(
					"I do not have a permission to send a message in that channel"
				);

			if (channel.type !== ChannelType.GuildText)
				return message.channel.send("Only guild text channel is accepted");

			const welcomeObj = {
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

			const embed = new EmbedBuilder().setDescription("ㅤ");
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

				welcomeObj.authorName = authorName.message;

				content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nChannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const authorURL = await startCollector(message);

				if (authorURL.error === "stop")
					return message.channel.send("I have stopped the command");

				if (authorURL.error !== "skip") {
					if (authorURL.attachment) {
						if (!(await checkIfImage(authorURL.attachment)))
							return message.channel.send("Invalid image");

						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURL.attachment,
						});

						welcomeObj.authorURL = authorURL.attachment;
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

						if (!(await checkIfImage(authorURLText)))
							return message.channel.send("Invalid image");

						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURLText,
						});

						welcomeObj.authorURL = authorURL.message;
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

				welcomeObj.title = title.message;

				content = `please provide an URL for URL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const titleURL = await startCollector(message);

				if (titleURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (titleURL.error !== "skip") {
					if (!validURL.isUri(titleURL.message))
						return message.channel.send(
							"Not a well formed URL. I have stopped the command."
						);

					embed.setURL(titleURL.message);

					welcomeObj.titleURL = titleURL.message;
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

				welcomeObj.description = description.message;
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

				welcomeObj.footerText = footerText.message;

				content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

				m.edit({ content, embeds: [embed] }).catch(() => {
					return message.channel.send("Invalid input");
				});

				const footerURL = await startCollector(message);

				if (footerURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (footerURL.error !== "skip") {
					if (footerURL.attachment) {
						if (!(await checkIfImage(footerURL.attachment)))
							return message.channel.send(
								"Not a well formed image. I have stopped the command."
							);

						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURL.attachment,
						});

						welcomeObj.footerURL = footerURL.attachment;
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

						if (!(await checkIfImage(footerURLText)))
							return message.channel.send(
								"Not a well formed image. I have stopped the command."
							);

						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURLText,
						});

						welcomeObj.footerURL = footerURL.message;
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
					if (!(await checkIfImage(thumbnail.attachment)))
						return message.channel.send(
							"Not a well formed image. I have stopped the command."
						);

					embed.setThumbnail(thumbnail.attachment);

					welcomeObj.thumbnail = thumbnail.attachment;
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

					if (!(await checkIfImage(thumbnailText)))
						return message.channel.send(
							"Not a well formed image. I have stopped the command."
						);

					embed.setThumbnail(thumbnailText);

					welcomeObj.thumbnail = thumbnail.message;
				}
			}

			content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{kanna avatar}\` - avatar of kanna\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const image = await startCollector(message);

			if (image.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (image.error !== "skip") {
				if (image.attachment) {
					if (!(await checkIfImage(image.attachment)))
						return message.channel.send(
							"Not a well formed image. I have stopped the command."
						);

					embed.setImage(image.attachment);

					welcomeObj.image = image.attachment;
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

					if (!(await checkIfImage(imageText)))
						return message.channel.send(
							"Not a well formed image. I have stopped the command."
						);

					embed.setImage(imageText);

					welcomeObj.image = image.message;
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

				welcomeObj.color = hexColor;
			}

			content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const confirmation = await startCollector(message);

			if (confirmation.message === "yes") {
				try {
					await WelcomeMessage.create({
						guildID: message.guild.id,
						channelID: channel.id,
						switch: false,
						authorName: welcomeObj.authorName,
						authorURL: welcomeObj.authorURL,
						title: welcomeObj.title,
						titleURL: welcomeObj.titleURL,
						thumbnail: welcomeObj.thumbnail,
						description: welcomeObj.description,
						image: welcomeObj.image,
						footerText: welcomeObj.footerText,
						footerURL: welcomeObj.footerURL,
						color: welcomeObj.color,
					});
				} catch {
					await WelcomeMessage.update(
						{
							channelID: channel.id,
							switch: false,
							authorName: welcomeObj.authorName,
							authorURL: welcomeObj.authorURL,
							title: welcomeObj.title,
							titleURL: welcomeObj.titleURL,
							thumbnail: welcomeObj.thumbnail,
							description: welcomeObj.description,
							image: welcomeObj.image,
							footerText: welcomeObj.footerText,
							footerURL: welcomeObj.footerURL,
							color: welcomeObj.color,
						},
						{ where: { guildID: message.guild.id } }
					);
				}

				client.welcomes.set(message.guild.id, welcomeObj);

				message.channel.send(
					`Welcome message has been set! Type \`${client.prefixes.get(
						message.guild.id
					)}${module.exports.name} on\` to turn on the welcome message`
				);
			} else {
				message.channel.send("I have stopped the command.");
			}
		}
	},
};
