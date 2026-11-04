const { EmbedBuilder, inlineCode } = require("discord.js");
const schemas = require("../../database/schemas");
const economies = require("../../utils/economies");
const {
  runPrefixCommand,
  slashCommand,
  textOption,
} = require("../../utils/slashCommands");
const {
  describeEquipment,
  equipmentLabel,
  findEquipment,
  normalizeEquipments,
} = require("../../utils/rpg/data");
const {
  SUCCESS_COLOR,
  TITLE_CASE,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  formatCoins,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "buy",
  aliases: ["b"],
  description: "Buy a piece of equipment",
  category: "rpg",
  usage: "<item>",
  run: async (client, message, args) => {
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
            )} to buy equipment.`,
          ),
        ],
      });
    }

    const query = args.join(" ").trim();

    if (!query) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Missing item",
            `Use ${commandHint(
              client,
              message,
              "buy",
              "<item>",
            )} with the name of the item you want. Browse the shop with ${commandHint(
              client,
              message,
              "shop",
            )}.`,
          ),
        ],
      });
    }

    const found = findEquipment(query);

    if (!found) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Item not found",
            `No equipment is named ${inlineCode(
              query.slice(0, 80),
            )}. Browse the shop with ${commandHint(client, message, "shop")}.`,
          ),
        ],
      });
    }

    const playerClass = character.get("class");
    const label = equipmentLabel(found.key);
    const className = TITLE_CASE(playerClass);

    if (!found.item.classes.includes(playerClass)) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Wrong class",
            `${label} is not available to ${className} characters.`,
          ),
        ],
      });
    }

    const playerEquipments = normalizeEquipments(character.get("equipments"));

    if (playerEquipments[found.category].inventory.includes(found.key)) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Already owned",
            `You already own ${label}. Equip it with ${commandHint(
              client,
              message,
              "equip",
              found.key,
            )}.`,
          ),
        ],
      });
    }

    const coins = await economies.getCoins(message.author);
    const wallet = coins.get("wallet");

    if (wallet < found.item.cost) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Not enough coins",
            `${label} costs ${formatCoins(
              found.item.cost,
            )}. You need ${formatCoins(found.item.cost - wallet)} more.`,
          ),
        ],
      });
    }

    const balance = wallet - found.item.cost;

    await schemas
      .coins()
      .update({ wallet: balance }, { where: { userID: message.author.id } });

    playerEquipments[found.category].inventory.push(found.key);

    await schemas
      .character()
      .update(
        { equipments: JSON.stringify(playerEquipments) },
        { where: { userID: message.author.id } },
      );

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: displayName(message.author),
            iconURL: avatarFor(message.author),
          })
          .setColor(SUCCESS_COLOR)
          .setTitle("Purchase complete")
          .setDescription(
            `You bought ${label} for ${formatCoins(found.item.cost)}.`,
          )
          .addFields(
            {
              name: "Balance",
              value: formatCoins(balance),
              inline: true,
            },
            {
              name: "Stats",
              value: describeEquipment(found.item),
            },
          )
          .setFooter({
            text: `Equip it with ${commandHint(
              client,
              message,
              "equip",
              found.key,
            )}.`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("buy", "Buy a piece of equipment", (builder) =>
      builder.addStringOption((option) =>
        textOption(option, "item", "Item to buy"),
      ),
    ),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports, [
        interaction.options.getString("item", true),
      ]),
  },
};
