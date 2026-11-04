const { EmbedBuilder } = require("discord.js");
const schemas = require("../../database/schemas");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  describeEquipment,
  equipmentLabel,
  shopCategories,
} = require("../../utils/rpg/data");
const {
  SHOP_COLOR,
  TITLE_CASE,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  formatCoins,
  paginateEmbeds,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "shop",
  aliases: ["sh"],
  description: "Browse equipment for sale",
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
            )} to browse the shop.`,
          ),
        ],
      });
    }

    const coins = await schemas
      .coins()
      .findOne({ where: { userID: message.author.id } });
    const balance = coins ? coins.get("wallet") : 0;
    const playerClass = character.get("class");
    const categories = shopCategories(playerClass, character.get("equipments"));

    const pages = categories.map((category, index) => {
      const items = category.items.map(
        ({ key, item }) =>
          `**${equipmentLabel(key)}** · ${formatCoins(item.cost)}\n${describeEquipment(
            item,
          )}`,
      );

      return new EmbedBuilder()
        .setAuthor({
          name: displayName(message.author),
          iconURL: avatarFor(message.author),
        })
        .setColor(SHOP_COLOR)
        .setTitle(`Shop: ${category.label.toLowerCase()}`)
        .setDescription(
          [
            `Items for ${TITLE_CASE(playerClass)} characters.`,
            `Your balance: ${formatCoins(balance)}`,
            items.length
              ? items.join("\n\n")
              : "No items are available for your class in this category.",
            `Buy with ${commandHint(client, message, "buy", "<item>")}.`,
          ].join("\n\n"),
        )
        .setFooter({
          text: `Page ${index + 1} of ${categories.length}`,
          iconURL: client.user.displayAvatarURL(),
        });
    });

    return paginateEmbeds(message, pages, { time: 180_000 });
  },
  interaction: {
    data: slashCommand("shop", "Browse equipment for sale"),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports),
  },
};
