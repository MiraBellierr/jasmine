const Battle = require("../../utils/rpg");
const { getMemberFromArguments } = require("../../utils/getters");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const { errorEmbed } = require("../../utils/rpg/ui");

module.exports = {
  name: "battle",
  aliases: ["bt"],
  description: "Battle a member or a random character",
  category: "rpg",
  usage: "[opponent]",
  run: async (client, message, args) => {
    const argument = args.join(" ").trim();

    if (!argument) {
      return new Battle(client, message, message.author).startRandom();
    }

    if (!message.guild) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Server only",
            "Battles against members only work in a server.",
          ),
        ],
      });
    }

    const member = await getMemberFromArguments(message, argument);

    if (!member) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Member not found",
            "No member in this server matches that name. Mention them or use their ID.",
          ),
        ],
      });
    }

    if (member.id === message.author.id) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Invalid opponent",
            "You cannot battle yourself. Choose another member.",
          ),
        ],
      });
    }

    return new Battle(client, message, message.author).startOpponent(
      member.user,
    );
  },
  interaction: {
    data: slashCommand(
      "battle",
      "Battle a member or a random character",
      (builder) =>
        builder.addUserOption((option) =>
          option
            .setName("opponent")
            .setDescription("Member to battle")
            .setRequired(false),
        ),
    ),
    run: async (client, interaction) => {
      const opponent = interaction.options.getUser("opponent");

      return runPrefixCommand(
        client,
        interaction,
        module.exports,
        opponent ? [opponent.id] : [],
      );
    },
  },
};
