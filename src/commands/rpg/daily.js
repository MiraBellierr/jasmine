const { EmbedBuilder } = require("discord.js");
const schemas = require("../../database/schemas");
const constants = require("../../utils/constants");
const economies = require("../../utils/economies");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  GOLD_COLOR,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  formatCoins,
  formatDuration,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "daily",
  description: "Claim a daily coin reward",
  category: "rpg",
  run: async (client, message) => {
    const character = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!character) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Not registered",
            `You are not registered. Register with ${commandHint(
              client,
              message,
              "register",
              "<class>",
            )} to start playing.`,
          ),
        ],
      });
    }

    const cooldown = await economies.getCooldown(
      message.author,
      "daily",
      864e5,
    );

    if (cooldown) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: displayName(message.author),
              iconURL: avatarFor(message.author),
            })
            .setColor(GOLD_COLOR)
            .setTitle("Daily already claimed")
            .setDescription(
              `You can claim again in ${formatDuration(cooldown)}.`,
            )
            .setTimestamp(),
        ],
      });
    }

    await schemas
      .timer()
      .update({ daily: Date.now() }, { where: { userID: message.author.id } });

    let reward = 100;
    let patreonBonus = false;

    try {
      const guild = await client.guilds.fetch(constants.supportServer.id);
      const member = await guild.members.fetch(message.author.id);

      if (member?.roles.cache.has(constants.patreon.id)) {
        reward = 200;
        patreonBonus = true;
      }
    } catch {
      // The reward still works when the support server is unavailable.
    }

    const coins = await economies.getCoins(message.author);
    const balance = coins.get("wallet") + reward;

    await schemas
      .coins()
      .update({ wallet: balance }, { where: { userID: message.author.id } });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: displayName(message.author),
        iconURL: avatarFor(message.author),
      })
      .setColor(GOLD_COLOR)
      .setTitle("Daily reward")
      .setDescription(`You claimed ${formatCoins(reward)}.`)
      .addFields({
        name: "Wallet",
        value: formatCoins(balance),
        inline: true,
      })
      .setFooter({
        text: patreonBonus
          ? "Patreon bonus applied. Claim again in 24 hours."
          : "Claim again in 24 hours.",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
  interaction: {
    data: slashCommand("daily", "Claim a daily coin reward"),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports),
  },
};
