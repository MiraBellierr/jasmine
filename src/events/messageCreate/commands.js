const { PermissionsBitField, ChannelType } = require("discord.js");
const signale = require("signale");
const contents = require("../../utils/constants");

module.exports = async (client, message) => {
	if (!message.guild) return;
	if (!message.channel.type !== ChannelType.GuildText) return;

	if (!client.prefixes.get(message.guild.id))
		client.prefixes.set(message.guild.id, process.env.PREFIX);

	const prefix = client.prefixes.get(message.guild.id);

	if (
		!message.guild.members.me.permissions.has(
			PermissionsBitField.Flags.SendMessages
		) ||
		!message.guild.members.me
			.permissionsIn(message.channel)
			.has(PermissionsBitField.Flags.SendMessages)
	)
		return;

	if (message.mentions.users.first() === client.user)
		message.reply(
			`My prefix for this server is \`${prefix}\`. Type \`${prefix}help\` for more info about me.`
		);

	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd.length === 0) return;

	let command = client.commands.get(cmd);
	if (!command) command = client.commands.get(client.aliases.get(cmd));
	if (!command) return;

	if (
		command.clientPermission &&
		!message.guild.members.me.permissions.has(
			PermissionsBitField.Flags[command.clientPermission]
		)
	) {
		return message.channel.send(
			`I do not have the \`${command.clientPermission}\` permission to be able to continue this command`
		);
	}

	if (
		command.memberPermission &&
		!message.member.permissions.has(
			PermissionsBitField.Flags[command.memberPermission]
		)
	) {
		return message.channel.send(
			`You don't have the \`${command.memberPermission}\` permission to use this command`
		);
	}

	try {
		await command.run(client, message, args);
	} catch (err) {
		signale.fatal(err);
		message.reply(
			"There was an error trying to execute this command. Report it by joining our server: https://discord.gg/NcPeGuNEdc"
		);

		client.channels.fetch(contents.errorChannel.id).then(
			(channel) => {
				return channel.send(
					`An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``
				);
			},
			() => {
				return;
			}
		);
	}
};
