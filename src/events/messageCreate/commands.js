const log = require("node-pretty-log");

module.exports = async (client, message) => {
	if (!message.guild) return;

	if (!client.prefixes.get(message.guild.id))
		client.prefixes.set(message.guild.id, process.env.PREFIX);

	const prefix = client.prefixes.get(message.guild.id);

	if (
		!message.guild.me.permissions.has("SEND_MESSAGES") ||
		!message.guild.me.permissionsIn(message.channel).has("SEND_MESSAGES")
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

	if (command) {
		try {
			command.run(client, message, args);
		} catch (err) {
			log("error", err);
			message.reply(
				"There was an error trying to execute this command. Report it by joining our server: https://discord.gg/NcPeGuNEdc"
			);
		}
	}
};
