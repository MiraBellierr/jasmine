const schemas = require("../../database/schemas");
const { argsError } = require("../../utils/errors");
const {
  applyDefaultPermission,
  runPrefixCommand,
  sendInteraction,
  slashCommand,
  textOption,
} = require("../../utils/slashCommands");

module.exports = {
  name: "prefix",
  description: "change a prefix for your server",
  category: "utility",
  memberPermission: "ManageGuild",
  usage: "<new prefix>",
  run: async (client, message, args) => {
    const Guilds = await schemas.guild();

    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    if (message.mentions.size > 0) {
      return argsError(module.exports, client, message);
    }

    try {
      await Guilds.create({
        guildID: message.guild.id,
        prefix: args.join(" "),
      });
    } catch {
      await Guilds.update(
        { prefix: args.join(" ") },
        { where: { guildID: message.guild.id } }
      );
    }

    client.prefixes.set(message.guild.id, args.join(" "));

    message.channel.send(
      `Prefix for this server has been changed to **${client.prefixes.get(
        message.guild.id
      )}**!`
    );
  },
  interaction: {
    data: applyDefaultPermission(
      slashCommand("prefix", "change a prefix for your server", (builder) =>
        builder.addStringOption((option) =>
          textOption(option, "value", "New prefix for this server"),
        ),
      ),
      "ManageGuild",
    ),
    run: async (client, interaction) => {
      const prefix = interaction.options.getString("value", true).trim();

      if (!prefix || /<(@!?|@&|#)\d+>/.test(prefix)) {
        return sendInteraction(interaction, "Please provide a valid prefix.", {
          ephemeral: true,
        });
      }

      return runPrefixCommand(client, interaction, module.exports, [prefix], {
        ephemeral: true,
      });
    },
  },
};
