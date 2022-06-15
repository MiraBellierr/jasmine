const { MessageEmbed } = require("discord.js");
const { getChannelFromArguments } = require("../../utils/getters");
const schemas = require("../../database/schemas");

module.exports = {
	name: "starboard",
	category: "[✨] utility",
	description: "A :star: starboard channel for your server",
	usage: "<set | on | off | star>",
	run: async (client, message, args) => {
		if (!message.member.permissions.has("MANAGE_CHANNELS"))
			return message.reply(
				"Sorry, you don't have a manage channels permission to use this command"
			);

		if (!args.length) {
			const embed = new MessageEmbed()
				.setAuthor({
					name: `${client.user.username} Starboard`,
					iconURL: client.user.displayAvatarURL({ dynamic: true }),
				})
				.setColor("#CD1C6C")
				.setDescription(
					`**Proper Usage:**\n• \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} set <channel>\`\n• \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} star <number>\`\n• \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} on\`\n• \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} off\``
				)
				.setFooter({ text: "starboard command" })
				.setTimestamp();

			return message.reply({ embeds: [embed] });
		}

		const Starboard = schemas.starboard();

		if (args[0] === "set") {
			if (!args[1])
				return message.reply(
					`The right syntax is \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} set <channel>\``
				);

			const channel = await getChannelFromArguments(message, args[1]);

			if (!channel)
				return message.reply("I didn't find any channel with this name");

			if (!message.guild.me.permissionsIn(channel).has("SEND_MESSAGES"))
				return message.reply(
					"I don't have a permission to send a message to that channel"
				);

			const starboardObj = {
				guildID: message.guild.id,
				channelID: channel.id,
				switch: true,
				star: 1,
			};

			try {
				await Starboard.create(starboardObj);

				client.starboards.set(message.guild.id, starboardObj);
			} catch {
				await Starboard.update(
					{
						channelID: channel.id,
					},
					{ where: { guildID: message.guild.id } }
				);

				const guildStarboard = client.starboards.get(message.guild.id);

				guildStarboard.channelID = channel.id;

				client.starboards.set(message.guild.id, guildStarboard);
			}

			const embed = new MessageEmbed()
				.setColor("#CD1C6C")
				.setDescription(`Starboard channel set to ${channel}`)
				.setTimestamp()
				.setFooter({
					text: "Starboard channel",
					iconURL: client.user.displayAvatarURL(),
				});

			message.reply({ embeds: [embed] });
		} else if (args[0] === "star") {
			if (!args[1])
				return message.reply(
					`The right syntax is \`${client.prefixes.get(message.guild.id)}${module.exports.name
					} star <number>\``
				);

			const input = parseInt(args[1]);

			if (!input || isNaN(input) || input < 1)
				return message.reply("Please enter a valid number");

			const starboardObj = client.starboards.get(message.guild.id);

			if (!starboardObj)
				return message.reply("You have't set a starboard channel yet");

			Starboard.update(
				{
					star: input,
				},
				{ where: { guildID: message.guild.id } }
			);

			starboardObj.star = input;

			client.starboards.set(message.guild.id, starboardObj);

			const embed = new MessageEmbed()
				.setColor("#CD1C6C")
				.setDescription(`Starboard star set to ${input}`)
				.setTimestamp()
				.setFooter({
					text: "Starboard star",
					iconURL: client.user.displayAvatarURL(),
				});

			message.reply({ embeds: [embed] });
		} else if (args[0] === "on") {
			const starboardObj = client.starboards.get(message.guild.id);

			if (!starboardObj)
				return message.reply("You haven't set a starboard channel yet");

			Starboard.update(
				{
					switch: true,
				},
				{ where: { guildID: message.guild.id } }
			);

			starboardObj.switch = true;

			client.starboards.set(message.guild.id, starboardObj);

			const embed = new MessageEmbed()
				.setColor("#CD1C6C")
				.setDescription(`Starboard has been set to **on**`)
				.setTimestamp()
				.setFooter({
					text: "Starboard enable",
					iconURL: client.user.displayAvatarURL(),
				});

			message.reply({ embeds: [embed] });
		} else if (args[0] === "off") {
			const starboardObj = client.starboards.get(message.guild.id);

			if (!starboardObj)
				return message.reply("You haven't set a starboard channel yet");

			Starboard.update(
				{
					switch: false,
				},
				{ where: { guildID: message.guild.id } }
			);

			starboardObj.switch = false;

			client.starboards.set(message.guild.id, starboardObj);

			const embed = new MessageEmbed()
				.setColor("#CD1C6C")
				.setDescription(`Starboard has been set to **off**`)
				.setTimestamp()
				.setFooter({
					text: "Starboard disable",
					iconURL: client.user.displayAvatarURL(),
				});

			message.reply({ embeds: [embed] });
		}
	},
};
