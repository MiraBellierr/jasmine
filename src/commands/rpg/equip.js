const { EmbedBuilder, inlineCode } = require("discord.js");
const schemas = require("../../database/schemas");
const {
  runPrefixCommand,
  slashCommand,
  textOption,
} = require("../../utils/slashCommands");
const {
  CATEGORIES,
  characterImage,
  describeEquipment,
  equipmentLabel,
  findEquipment,
  normalizeEquipments,
} = require("../../utils/rpg/data");
const {
  BRAND_COLOR,
  SUCCESS_COLOR,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  formatStats,
} = require("../../utils/rpg/ui");

const equippedOverview = (client, message, character, equipments) => {
  const lines = [];
  const totals = {};

  for (const category of CATEGORIES) {
    const equipped = equipments[category.key].equipped;
    const found = equipped ? findEquipment(equipped) : null;

    lines.push(
      `${category.emoji} **${category.fieldLabel}** ${
        found ? equipmentLabel(found.key) : "None"
      }`,
    );

    if (found) {
      for (const [key, value] of Object.entries(found.item.attr)) {
        totals[key] = (totals[key] || 0) + Number(value);
      }
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: displayName(message.author),
      iconURL: avatarFor(message.author),
    })
    .setColor(BRAND_COLOR)
    .setTitle("Equipped items")
    .addFields(
      { name: "Slots", value: lines.join("\n"), inline: true },
      {
        name: "Bonuses",
        value: Object.keys(totals).length ? formatStats(totals) : "No bonuses.",
        inline: true,
      },
    )
    .setFooter({
      text: `Equip an item with ${commandHint(
        client,
        message,
        "equip",
        "<item>",
      )}.`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  const portrait = characterImage(character.toJSON());

  if (portrait) {
    embed.setThumbnail(portrait);
  }

  return embed;
};

module.exports = {
  name: "equip",
  description: "Equip an item you own",
  category: "rpg",
  usage: "[item]",
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
            )} to use equipment.`,
          ),
        ],
      });
    }

    const playerEquipments = normalizeEquipments(character.get("equipments"));
    const query = args.join(" ").trim();

    if (!query) {
      return message.reply({
        embeds: [
          equippedOverview(client, message, character, playerEquipments),
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
            )}. Check your inventory with ${commandHint(
              client,
              message,
              "inventory",
            )}.`,
          ),
        ],
      });
    }

    if (!playerEquipments[found.category].inventory.includes(found.key)) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Not owned",
            `You do not own ${equipmentLabel(
              found.key,
            )}. Buy it with ${commandHint(client, message, "buy", found.key)}.`,
          ),
        ],
      });
    }

    const label = equipmentLabel(found.key);
    const previous = playerEquipments[found.category].equipped;

    if (previous === found.key) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: displayName(message.author),
              iconURL: avatarFor(message.author),
            })
            .setColor(BRAND_COLOR)
            .setTitle("Already equipped")
            .setDescription(
              `${label} is already equipped in your ${found.categoryInfo.singular} slot.`,
            )
            .addFields({ name: "Stats", value: describeEquipment(found.item) })
            .setTimestamp(),
        ],
      });
    }

    playerEquipments[found.category].equipped = found.key;

    await schemas
      .character()
      .update(
        { equipments: JSON.stringify(playerEquipments) },
        { where: { userID: message.author.id } },
      );

    const replaced =
      previous && previous !== found.key
        ? ` It replaced ${equipmentLabel(previous)}.`
        : "";

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: displayName(message.author),
            iconURL: avatarFor(message.author),
          })
          .setColor(SUCCESS_COLOR)
          .setTitle("Item equipped")
          .setDescription(
            `You equipped ${label} in your ${found.categoryInfo.singular} slot.${replaced}`,
          )
          .addFields({ name: "Stats", value: describeEquipment(found.item) })
          .setFooter({
            text: `View your loadout with ${commandHint(
              client,
              message,
              "equip",
            )}.`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("equip", "Equip an item you own", (builder) =>
      builder.addStringOption((option) =>
        textOption(option, "item", "Item to equip", false),
      ),
    ),
    run: async (client, interaction) => {
      const item = interaction.options.getString("item");

      return runPrefixCommand(
        client,
        interaction,
        module.exports,
        item ? [item] : [],
      );
    },
  },
};
