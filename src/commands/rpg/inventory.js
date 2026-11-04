const { EmbedBuilder } = require("discord.js");
const schemas = require("../../database/schemas");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  describeEquipment,
  equipmentLabel,
  inventoryCategories,
} = require("../../utils/rpg/data");
const {
  BRAND_COLOR,
  avatarFor,
  commandHint,
  countLabel,
  displayName,
  errorEmbed,
  paginateEmbeds,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "inventory",
  aliases: ["inv"],
  description: "View your equipment",
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

    const categories = inventoryCategories(character.get("equipments"));
    const total = categories.reduce(
      (count, category) => count + category.items.length,
      0,
    );

    if (!total) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: displayName(message.author),
              iconURL: avatarFor(message.author),
            })
            .setColor(BRAND_COLOR)
            .setTitle("Inventory")
            .setDescription(
              `Your inventory is empty. Buy equipment with ${commandHint(
                client,
                message,
                "buy",
                "<item>",
              )}.`,
            )
            .setTimestamp(),
        ],
      });
    }

    const pages = categories.map((category, index) =>
      new EmbedBuilder()
        .setAuthor({
          name: displayName(message.author),
          iconURL: avatarFor(message.author),
        })
        .setColor(BRAND_COLOR)
        .setTitle(`Inventory: ${category.label.toLowerCase()}`)
        .setDescription(
          category.items.length
            ? category.items
                .map(({ key, item }) => {
                  const equipped = key === category.equipped;

                  return `**${equipmentLabel(key)}**${
                    equipped ? " (equipped)" : ""
                  }\n${describeEquipment(item)}`;
                })
                .join("\n\n")
            : `You do not own any ${category.label.toLowerCase()}.`,
        )
        .setFooter({
          text: `Page ${index + 1} of ${categories.length} · ${countLabel(
            total,
            "item",
          )}`,
          iconURL: client.user.displayAvatarURL(),
        }),
    );

    return paginateEmbeds(message, pages, { time: 180_000 });
  },
  interaction: {
    data: slashCommand("inventory", "View your equipment"),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports),
  },
};
