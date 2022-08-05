const signale = require("signale");
const contents = require("../../utils/constants");

module.exports = async (client, interaction) => {
	const command = client.interactions.get(interaction.commandName);

	if (!command) return;

	try {
		await command.run(client, interaction);
	} catch (err) {
		signale.fatal(err);

		interaction.channel.send(
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
