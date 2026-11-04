const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const classes = require("../../database/json/classes.json");
const characters = require("../../database/json/characters.json");
const schemas = require("../../database/schemas");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  BRAND_COLOR,
  SUCCESS_COLOR,
  TITLE_CASE,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
} = require("../../utils/rpg/ui");

const CLASS_NOTES = {
  warrior: "Highest HP and stamina. Can use every shield.",
  fox: "Highest agility and accuracy. Can use some shields.",
  ghost: "Highest strength and attack. Has the fewest weapons and no shields.",
};

const classStats = (stats) =>
  [
    `HP ${stats.hp}`,
    `Strength ${stats.str} · Agility ${stats.agl} · Stamina ${stats.sta}`,
    `Accuracy ${stats.acc} · Evasion ${stats.eva}`,
    `Attack ${stats.att} · Defense ${stats.def}`,
  ].join("\n");

const classEmbed = (client, message, invalidClass) => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Jasmine RPG", iconURL: client.user.displayAvatarURL() })
    .setColor(BRAND_COLOR)
    .setTitle("Choose a class")
    .setDescription(
      [
        invalidClass
          ? "That class is not available. Choose one of the classes below."
          : "Pick a class to start your character.",
        `Register with ${commandHint(client, message, "register", "<class>")}. Your class sets your starting stats and the equipment you can use.`,
      ].join("\n\n"),
    )
    .setTimestamp();

  for (const [key, stats] of Object.entries(classes)) {
    embed.addFields({
      name: TITLE_CASE(key),
      value: `${CLASS_NOTES[key] || "A playable class."}\n${classStats(stats)}`,
    });
  }

  return embed;
};

module.exports = {
  name: "register",
  description: "Create a character",
  category: "rpg",
  usage: "<class>",
  run: async (client, message, args) => {
    const existing = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (existing) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Already registered",
            `You already have a character. Use ${commandHint(
              client,
              message,
              "profile",
            )} to view it.`,
          ),
        ],
      });
    }

    const requested = String(args[0] || "").toLowerCase();

    if (!classes[requested]) {
      return message.reply({
        embeds: [classEmbed(client, message, Boolean(requested))],
      });
    }

    const characterKeys = Object.keys(characters);
    const characterKey =
      characterKeys[Math.floor(Math.random() * characterKeys.length)];
    const character = characters[characterKey];

    try {
      await schemas.character().create({
        userID: message.author.id,
        name: character.name,
        class: requested,
        level: 1,
        img: characterKey,
        images: JSON.stringify([characterKey]),
        equipments: JSON.stringify({
          weapons: { equipped: "", inventory: [] },
          shields: { equipped: "", inventory: [] },
          helmet: { equipped: "", inventory: [] },
          armor: { equipped: "", inventory: [] },
          gloves: { equipped: "", inventory: [] },
        }),
        ...classes[requested],
      });
    } catch (error) {
      const duplicate = await schemas
        .character()
        .findOne({ where: { userID: message.author.id } });

      if (duplicate) {
        return message.reply({
          embeds: [
            errorEmbed(
              client,
              "Already registered",
              `You already have a character. Use ${commandHint(
                client,
                message,
                "profile",
              )} to view it.`,
            ),
          ],
        });
      }

      throw error;
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: displayName(message.author),
            iconURL: avatarFor(message.author),
          })
          .setColor(SUCCESS_COLOR)
          .setTitle("Registration complete")
          .setDescription(
            `You are playing as ${escapeMarkdown(character.name)}, a level 1 ${TITLE_CASE(
              requested,
            )}.`,
          )
          .setThumbnail(character.image)
          .addFields({
            name: "Starting stats",
            value: classStats(classes[requested]),
          })
          .setFooter({
            text: `View your character with ${commandHint(
              client,
              message,
              "profile",
            )}.`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("register", "Create a character", (builder) =>
      builder.addStringOption((option) =>
        option
          .setName("class")
          .setDescription("Class to play")
          .setRequired(true)
          .addChoices(
            ...Object.keys(classes).map((key) => ({
              name: TITLE_CASE(key),
              value: key,
            })),
          ),
      ),
    ),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports, [
        interaction.options.getString("class", true),
      ]),
  },
};
