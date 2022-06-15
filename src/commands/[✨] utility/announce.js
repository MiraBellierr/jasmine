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
			content = `please provide a url or attachment for author iconURL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

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
					embed.setAuthor({
						name: authorName.message,
						iconURL: authorIconURL.message,
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
				try {
					embed.setURL(url.message);
				} catch (e) {
					message.reply("Error: Not a well formed URL!");
				}
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

			content = `please provide a url or attachment for footer iconURL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

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
					embed.setFooter({
						text: footerText.message,
						iconURL: footerIconURL.message,
					});
				}
			}
		}

		content = `please provide a url or attachment for thumbnail slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

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
				embed.setThumbnail(thumbnail.message);
			}
		}

		content = `please provide a url or attachment for image slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

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
				embed.setImage(image.message);
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
