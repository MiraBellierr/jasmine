const Getter = require("../../utils/Getter");
const Error = require("../../utils/Error");
const schemas = require("../../database/schemas");
const Collector = require("../../utils/Collector");
const { MessageEmbed } = require("discord.js");
const Color = require("color");

module.exports = {
	name: "setwelcome",
	aliases: ["sw"],
	category: "[✨] utility",
	description: "Welcome message configuration",
	usage: "<channel | on | off>",
	run: async (client, message, args) => {
		if (!message.member.permissions.has("MANAGE_CHANNELS"))
			return message.channel.send(
				"Sorry, you don't have manage channels permission to use this command."
			);

		if (!args.length)
			return new Error(module.exports, client, message).argsError();

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
			const channel = await new Getter(message, arg).getChannel();

			if (!channel)
				return new Error(module.exports, client, message).argsError();

			if (!message.guild.me.permissionsIn(channel).has("SEND_MESSAGES"))
				return message.channel.send(
					"I do not have a permission to send a message in that channel"
				);

			if (channel.type !== "GUILD_TEXT")
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

			const embed = new MessageEmbed().setDescription("ㅤ");
			let content = `Please provide a name for \`author\` slot\n\`skip\` to skip\n\`stop\` to stop\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nChannel: ${channel}`;

			const m = await message.channel.send({ content, embeds: [embed] });

			const authorName = await new Collector(message).startCollector(256);

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

				content = `please provide a url or attachment for author iconURL slot, \`skip\` to skip. \`stop\` to stop.\nChannel: ${channel}`;

				m.edit({ content, embeds: [embed] });

				const authorURL = await new Collector(message).startCollector();

				if (authorURL.error === "stop")
					return message.channel.send("I have stopped the command");

				if (authorURL.error !== "skip") {
					if (authorURL.attachment) {
						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURL.attachment,
						});

						welcomeObj.authorURL = authorURL.attachment;
					} else {
						embed.setAuthor({
							name: authorNameEmbed,
							iconURL: authorURL.message,
						});

						welcomeObj.authorURL = authorURL.message;
					}
				}
			}

			content = `please provide a title for title slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count'\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const title = await new Collector(message).startCollector(256);

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

				m.edit({ content, embeds: [embed] });

				const titleURL = await new Collector(message).startCollector();

				if (titleURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (titleURL.error !== "skip") {
					try {
						embed.setURL(titleURL.message);

						welcomeObj.titleURL = titleURL.message;
					} catch (e) {
						return message.channel.send("Error: Not a well formed URL!");
					}
				}
			}

			content = `please provide a description for description slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{mention}\` - a mention of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const description = await new Collector(message).startCollector(2048);

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

			const footerText = await new Collector(message).startCollector(2048);

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

				content = `please provide a url or attachment for footer iconURL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

				m.edit({ content, embeds: [embed] });

				const footerURL = await new Collector(message).startCollector();

				if (footerURL.error === "stop")
					return message.channel.send("I have stopped the command.");

				if (footerURL.error !== "skip") {
					if (footerURL.attachment) {
						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURL.attachment,
						});

						welcomeObj.footerURL = footerURL.attachment;
					} else {
						embed.setFooter({
							text: footerEmbed,
							iconURL: footerURL.message,
						});

						welcomeObj.footerURL = footerURL.message;
					}
				}
			}

			content = `please provide a url or attachment for thumbnail slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const thumbnail = await new Collector(message).startCollector();

			if (thumbnail.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (thumbnail.error !== "skip") {
				if (thumbnail.attachment) {
					embed.setThumbnail(thumbnail.attachment);

					welcomeObj.thumbnail = thumbnail.attachment;
				} else {
					embed.setThumbnail(thumbnail.message);

					welcomeObj.thumbnail = thumbnail.message;
				}
			}

			content = `please provide a url or attachment for image slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const image = await new Collector(message).startCollector();

			if (image.error === "stop")
				return message.channel.send("I have stopped the command.");

			if (image.error !== "skip") {
				if (image.attachment) {
					embed.setImage(image.attachment);

					welcomeObj.image = image.attachment;
				} else {
					embed.setImage(image.message);

					welcomeObj.image = image.message;
				}
			}

			content =
				"What color do you want to use for the embed?\n`skip` to skip\n`stop` to stop";

			m.edit({ content, embeds: [embed] });

			const color = await new Collector(message).startCollector();

			if (color.error === "stop")
				return message.channel.send("I have stopped the command");

			if (color.error !== "skip") {
				const hexColor = Color(color.message.toLowerCase()).hex();

				embed.setColor(hexColor);

				welcomeObj.color = hexColor;
			}

			content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

			m.edit({ content, embeds: [embed] });

			const confirmation = await new Collector(message).startCollector();

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
