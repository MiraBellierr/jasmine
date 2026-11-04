const { EmbedBuilder } = require("discord.js");
const schemas = require("../../database/schemas");
const { getUserFromArguments } = require("../../utils/getters");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  GOLD_COLOR,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  formatCoins,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "wallet",
  aliases: ["bal", "money", "cash", "balance"],
  description: "View a wallet balance",
  category: "rpg",
  usage: "[user]",
  run: async (client, message, args) => {
    const argument = args.join(" ").trim();
    const user = argument
      ? await getUserFromArguments(message, argument)
      : message.author;

    if (!user) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "User not found",
            "No user matches that name. Mention the user or use their ID.",
          ),
        ],
      });
    }

    const character = await schemas
      .character()
      .findOne({ where: { userID: user.id } });
    const isSelf = user.id === message.author.id;
    const name = displayName(user);

    if (!character) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Not registered",
            `${
              isSelf ? "You are" : `${name} is`
            } not registered. Register with ${commandHint(
              client,
              message,
              "register",
              "<class>",
            )}.`,
          ),
        ],
      });
    }

    const coins = await schemas.coins().findOne({ where: { userID: user.id } });
    const wallet = coins ? coins.get("wallet") : 0;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name, iconURL: avatarFor(user) })
          .setColor(GOLD_COLOR)
          .setTitle("Wallet")
          .setDescription(formatCoins(wallet))
          .setFooter({
            text: `Claim a daily reward with ${commandHint(
              client,
              message,
              "daily",
            )}.`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("wallet", "View a wallet balance", (builder) =>
      builder.addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Member to view")
          .setRequired(false),
      ),
    ),
    run: async (client, interaction) => {
      const user = interaction.options.getUser("user");

      return runPrefixCommand(
        client,
        interaction,
        module.exports,
        user ? [user.id] : [],
      );
    },
  },
};
