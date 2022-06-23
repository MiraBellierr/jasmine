const signale = require("signale");
const schemas = require("../../database/schemas");
const contents = require("../../utils/constants");

module.exports = async (client, message) => {
	if (!message.guild) return;
	s;
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

	const timer = client.timer.get(message.author.id);
	const cooldown = 60000;

	if (!timer || timer - (Date.now() - cooldown) < 1) {
		client.timer.set(message.author.id, Date.now());

		let coins = await schemas.coins().findOne({
			where: { userID: message.author.id },
		});

		if (!coins) {
			coins = await schemas.coins().create({
				userID: message.author.id,
			});
		}
		const currentMaxDeposit = coins.get("maxDeposit");

		schemas.coins().update(
			{
				maxDeposit: currentMaxDeposit + 1,
			},
			{ where: { userID: message.author.id } }
		);
	}

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd.length === 0) return;

	let command = client.commands.get(cmd);
	if (!command) command = client.commands.get(client.aliases.get(cmd));
	if (!command) return;

	try {
		await command.run(client, message, args);
	} catch (err) {
		if (err.message.includes("Cannot send an empty message")) return;

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
