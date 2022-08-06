const ms = require("ms");
const Discord = require("discord.js");
const { startCollector } = require("../../utils/collectors");
const { getChannelFromArguments } = require("../../utils/getters");
const { ChannelType } = require("discord.js");

module.exports = {
	name: "giveaway",
	aliases: ["giveaways"],
	category: "[✨] utility",
	description: "Set up a giveaway on your server",
	memberPermission: "ManageChannels",
	usage: "<start | end | reroll",
	run: async (client, message, args) => {
		if (!args[0] || !args[1]) {
			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: `${client.user.username}'s giveaway commands`,
					iconURL: client.user.avatarURL(),
				})
				.setColor("#CD1C6C")
				.setDescription(
					`**Proper Usage:**\n• ${client.prefixes.get(
						message.guild.id
					)}giveaway start \`<channel>\`\n• ${client.prefixes.get(
						message.guild.id
					)}giveaway end \`[message ID | prize]\`\n• ${client.prefixes.get(
						message.guild.id
					)}giveaway reroll \`[message ID | prize]\``
				)
				.setTimestamp();

			return message.reply({ embeds: [embed] });
		}

		if (args[0].toLowerCase() === "start") {
			let giveawayChannel = "None",
				giveawayDuration = "None",
				numberOfWinners = "None",
				giveawayPrize = "None";

			const channel = await getChannelFromArguments(message, args[1]);

			if (!channel)
				return message.channel.send(
					"I didn't found any channel with that name."
				);

			if (
				!message.guild.members.me
					.permissionsIn(channel)
					.has(Discord.PermissionsBitField.Flags.SendMessages)
			)
				return message.channel.send(
					"I do not have a permission to send a message in that channel."
				);

			giveawayChannel = channel;

			const example = new Discord.EmbedBuilder()
				.setDescription("ㅤ")
				.addFields([{ name: "Channel", value: channel.toString() }]);

			let content =
				"Please provide a duration how long it would be.(example:`10m`, `1h`, `2.5h`, `1d`)\n\nType `stop` if you want to stop.";

			const m = await message.reply({ content, embeds: [example] });

			const giveawayDurationinput = await startCollector(message);

			if (giveawayDurationinput.error === "stop") {
				return message.channel.send("I have stopped the command");
			} else {
				if (isNaN(ms(giveawayDurationinput.message)))
					return message.channel.send("Invalid Input");

				giveawayDuration = giveawayDurationinput.message;

				example.addFields([{ name: "Duration", value: `${giveawayDuration}` }]);
			}

			content =
				"How many winners would it be?\n\nType `stop` if you want to stop.";

			m.edit({ content, embeds: [example] });

			const numberOfWinnersInput = await startCollector(message);

			if (numberOfWinnersInput.error === "stop") {
				return message.channel.send("I have stopped the command");
			} else {
				if (
					isNaN(numberOfWinnersInput.message) ||
					parseInt(numberOfWinnersInput.message < 1)
				)
					return message.channel.send("Invalid input.");

				numberOfWinners = parseInt(numberOfWinnersInput.message);

				example.addFields([
					{
						name: "Number Of Winners",
						value: `${numberOfWinners}`,
					},
				]);
			}

			content =
				"What is the prize of the giveaway?\n\nType `stop` if you want to stop.";

			m.edit({ content, embeds: [example] });

			const giveawayPrizeInput = await startCollector(message);

			if (giveawayPrizeInput.error === "stop") {
				return message.channel.send("I have stopped the command");
			} else {
				giveawayPrize = giveawayPrizeInput.message;

				example.addFields([{ name: "Prize", value: `${giveawayPrize}` }]);
			}

			content = "Is this okay? (yes or no)";

			m.edit({ content, embeds: [example] });

			const confirm = await startCollector(message);

			if (confirm.message === "yes") {
				client.giveawaysManager.start(giveawayChannel, {
					time: ms(giveawayDuration),
					prize: giveawayPrize,
					winnerCount: numberOfWinners,
					hostedBy: message.author,
					messages: {
						giveaway: "🎉 **GIVEAWAY** 🎉",
						giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
						timeRemaining: "Time remaining: **{duration}**!",
						inviteToParticipate: "React with 🎉 to participate!",
						winMessage:
							"Congratulations, {winners}! You won 🎉 **{prize}**! 🎉",
						embedFooter: "Giveaways",
						noWinner: "Giveaway cancelled, no valid participations.",
						hostedBy: "Hosted by: {user}",
						winners: "winner(s)",
						endedAt: "Ended at",
						units: {
							seconds: "seconds",
							minutes: "minutes",
							hours: "hours",
							days: "days",
							pluralS: false,
						},
					},
				});

				message.reply(`Giveaway started in ${giveawayChannel}!`);
			} else {
				return message.channel.send("I have stopped the command.");
			}
		} else if (args[0].toLowerCase() === "end") {
			const giveawayGuild = client.giveawaysManager.giveaways.filter(
				(g) => g.guildID === message.guild.id
			);

			if (!args[1]) {
				return message.reply(
					`**${
						message.author.username
					}**, The right syntax is \`${client.prefixes.get(
						message.guild.id
					)}giveaway end <message ID | prize>\`.`
				);
			}

			const giveaway =
				giveawayGuild.find((g) => g.prize === args.slice(1).join(" ")) ||
				giveawayGuild.find((g) => g.messageID === args[1]);

			if (!giveaway) {
				return message.reply(
					`Unable to find a giveaway for \`${args.slice(1).join(" ")}\`.`
				);
			}

			client.giveawaysManager
				.edit(giveaway.messageID, {
					setEndTimestamp: Date.now(),
				})
				.then(() => {
					message.reply(
						`Giveaway will end in less than ${
							client.giveawaysManager.options.updateCountdownEvery / 1000
						} seconds...`
					);
				})
				.catch((e) => {
					if (
						e.startsWith(
							`Giveaway with message ID ${giveaway.messageID} is already ended.`
						)
					) {
						message.reply("This giveaway is already ended!");
					} else {
						console.error(e);

						message.reply("An error occured...");
					}
				});
		} else if (args[0].toLowerCase() === "reroll") {
			let giveaway;
			const giveawayGuild = client.giveawaysManager.giveaways.filter(
				(g) => g.guildID === message.guild.id
			);

			if (!args[1]) {
				giveaway = giveawayGuild[giveawayGuild.length - 1];
			}

			if (args[1]) {
				giveaway =
					giveawayGuild.find((g) => g.prize === args.slice(1).join(" ")) ||
					giveawayGuild.find((g) => g.messageID === args[1]);
			}

			if (!giveaway) {
				return message.reply(
					"Unable to find a giveaway for `" + args.slice(1).join(" ") + "`."
				);
			}

			client.giveawaysManager
				.reroll(giveaway.messageID)
				.then(() => {
					message.reply("Giveaway rerolled!");
				})
				.catch((e) => {
					if (
						e.startsWith(
							`Giveaway with message ID ${giveaway.messageID} is not ended.`
						)
					) {
						message.reply("This giveaway is not ended!");
					} else {
						console.error(e);

						message.reply("An error occured...");
					}
				});
		}
	},
	interaction: {
		data: {
			name: "giveaway",
			description: "Create a giveaway",
			type: 1,
			default_member_permissions:
				Discord.PermissionsBitField.Flags.ManageChannels.toString(),
			options: [
				{
					name: "create",
					description: "Create a giveaway",
					type: 1,
					options: [
						{
							name: "duration",
							description: "Duration of the giveaway",
							type: 3,
							required: true,
						},
						{
							name: "prize",
							description: "Prize of the giveaway",
							type: 3,
							required: true,
						},
						{
							name: "channel",
							description: "Channel of the giveaway",
							type: 7,
							required: true,
							channel_types: [ChannelType.GuildText],
						},
						{
							name: "winners",
							description: "Number of winners of the giveaway",
							type: 4,
							required: true,
						},
					],
				},
				{
					name: "end",
					description: "End a giveaway",
					type: 1,
					options: [
						{
							name: "message_id",
							description: "message_id of the giveaway",
							type: 3,
							required: true,
						},
					],
				},
				{
					name: "reroll",
					description: "Reroll a giveaway",
					type: 1,
					options: [
						{
							name: "message_id",
							description: "message_id of the giveaway",
							type: 3,
						},
					],
				},
			],
		},
		run: async (client, interaction) => {
			const subcommand = interaction.options.getSubcommand();
			if (subcommand === "create") {
				const duration = interaction.options.getString("duration");
				const prize = interaction.options.getString("prize");
				const channel = interaction.options.getChannel("channel");
				const winners = interaction.options.getInteger("winners");

				if (isNaN(ms(duration)))
					return interaction.reply("`duration` - Invalid Input");

				client.giveawaysManager.start(channel, {
					time: ms(duration),
					prize,
					winnerCount: winners,
					hostedBy: interaction.user,
					messages: {
						giveaway: "🎉 **GIVEAWAY** 🎉",
						giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
						timeRemaining: "Time remaining: **{duration}**!",
						inviteToParticipate: "React with 🎉 to participate!",
						winMessage:
							"Congratulations, {winners}! You won 🎉 **{prize}**! 🎉",
						embedFooter: "Giveaways",
						noWinner: "Giveaway cancelled, no valid participations.",
						hostedBy: "Hosted by: {user}",
						winners: "winner(s)",
						endedAt: "Ended at",
						units: {
							seconds: "seconds",
							minutes: "minutes",
							hours: "hours",
							days: "days",
							pluralS: false,
						},
					},
				});

				interaction.reply(`Giveaway started in ${channel}!`);
			} else if (subcommand === "end") {
				const messageId = interaction.options.getString("message_id");

				const giveawayGuild = client.giveawaysManager.giveaways.filter(
					(g) => g.guildID === interaction.guild.id
				);

				const giveaway = giveawayGuild.find((g) => g.messageID === messageId);

				if (!giveaway) {
					return interaction.reply(
						`Unable to find a giveaway for \`${messageId}\`.`
					);
				}

				client.giveawaysManager
					.edit(giveaway.messageID, {
						setEndTimestamp: Date.now(),
					})
					.then(() => {
						interaction.reply(
							`Giveaway will end in less than ${
								client.giveawaysManager.options.updateCountdownEvery / 1000
							} seconds...`
						);
					})
					.catch((e) => {
						if (
							e.startsWith(
								`Giveaway with message ID ${giveaway.messageID} is already ended.`
							)
						) {
							interaction.reply("This giveaway is already ended!");
						} else {
							console.error(e);

							interaction.reply("An error occured...");
						}
					});
			} else {
				const messageId = interaction.options.getString("message_id");
				let giveaway;
				const giveawayGuild = client.giveawaysManager.giveaways.filter(
					(g) => g.guildID === interaction.guild.id
				);

				if (!messageId) {
					giveaway = giveawayGuild[giveawayGuild.length - 1];
				}

				if (messageId) {
					giveaway = giveawayGuild.find((g) => g.messageID === messageId);
				}

				if (!giveaway) {
					return interaction.reply(
						"Unable to find a giveaway for `" + messageId + "`."
					);
				}

				client.giveawaysManager
					.reroll(giveaway.messageID)
					.then(() => {
						interaction.reply("Giveaway rerolled!");
					})
					.catch((e) => {
						if (
							e.startsWith(
								`Giveaway with message ID ${giveaway.messageID} is not ended.`
							)
						) {
							interaction.reply("This giveaway is not ended!");
						} else {
							console.error(e);

							interaction.reply("An error occured...");
						}
					});
			}
		},
	},
};
