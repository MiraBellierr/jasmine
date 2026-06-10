const signale = require("signale");
const contents = require("../../utils/constants");
const { PermissionsBitField } = require("discord.js");
const { sendInteraction } = require("../../utils/slashCommands");

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) {
    return;
  }

  const command = client.interactions.get(interaction.commandName);

  if (!command) {
    return;
  }

  const prefixCommand = command.command || {};

  if (
    prefixCommand.clientPermission &&
    interaction.guild &&
    !interaction.guild.members.me.permissions.has(
      PermissionsBitField.Flags[prefixCommand.clientPermission],
    )
  ) {
    return sendInteraction(
      interaction,
      `I do not have the \`${prefixCommand.clientPermission}\` permission to be able to continue this command`,
      { ephemeral: true },
    );
  }

  if (
    prefixCommand.memberPermission &&
    interaction.member &&
    !interaction.member.permissions.has(
      PermissionsBitField.Flags[prefixCommand.memberPermission],
    )
  ) {
    return sendInteraction(
      interaction,
      `You don't have the \`${prefixCommand.memberPermission}\` permission to use this command`,
      { ephemeral: true },
    );
  }

  try {
    await command.run(client, interaction);
  } catch (err) {
    signale.fatal(err);

    await sendInteraction(
      interaction,
      "There was an error trying to execute this command. Report it by joining our server: https://discord.gg/NcPeGuNEdc",
      { ephemeral: true },
    );

    client.channels.fetch(contents.errorChannel.id).then(
      (channel) => {
        return channel.send(
          `An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``,
        );
      },
      () => {
        return;
      },
    );
  }
};
