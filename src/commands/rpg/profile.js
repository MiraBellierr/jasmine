const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const schemas = require("../../database/schemas");
const {
  getUserFromArguments,
  getMemberFromArguments,
} = require("../../utils/getters");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const {
  CATEGORIES,
  characterImage,
  equipmentLabel,
  normalizeEquipments,
} = require("../../utils/rpg/data");
const {
  BRAND_COLOR,
  STAT_EMOJI,
  TITLE_CASE,
  avatarFor,
  commandHint,
  displayName,
  errorEmbed,
  memberName,
  progressBar,
} = require("../../utils/rpg/ui");

const statBlock = (character) => {
  const stat = (key, label) =>
    `${STAT_EMOJI[key] || ""} **${label}** ${character.get(key)}`;

  return [
    [stat("hp", "HP"), stat("sta", "Stamina")].join(" · "),
    [stat("str", "Strength"), stat("agl", "Agility")].join(" · "),
    [stat("att", "Attack"), stat("def", "Defense")].join(" · "),
    [stat("acc", "Accuracy"), stat("eva", "Evasion")].join(" · "),
  ].join("\n");
};

const equipmentBlock = (equipments) =>
  CATEGORIES.map((category) => {
    const equipped = equipments[category.key].equipped;

    return `${category.emoji} **${category.fieldLabel}** ${
      equipped ? equipmentLabel(equipped) : "None"
    }`;
  }).join("\n");

module.exports = {
  name: "profile",
  aliases: ["pf"],
  description: "View a character profile",
  category: "rpg",
  usage: "[user]",
  run: async (client, message, args) => {
    const argument = args.join(" ").trim();
    let member = message.member;
    let user = message.author;

    if (argument) {
      member = message.guild
        ? await getMemberFromArguments(message, argument)
        : null;

      if (member) {
        user = member.user;
      } else {
        user = await getUserFromArguments(message, argument);
      }

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
    }

    const character = await schemas
      .character()
      .findOne({ where: { userID: user.id } });
    const isSelf = user.id === message.author.id;
    const name = member ? memberName(member) : displayName(user);

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

    const level = character.get("level");
    const equipments = normalizeEquipments(character.get("equipments"));
    const portrait = characterImage(character.toJSON());

    const embed = new EmbedBuilder()
      .setAuthor({
        name,
        iconURL: avatarFor(user),
      })
      .setColor(BRAND_COLOR)
      .setTitle(escapeMarkdown(character.get("name")))
      .setDescription(
        [
          `Level ${level} ${TITLE_CASE(character.get("class"))}`,
          `XP ${progressBar(character.get("xp"), character.get("xpNeeded"))}`,
        ].join("\n"),
      )
      .addFields(
        {
          name: "Stats",
          value: statBlock(character),
          inline: true,
        },
        {
          name: "Equipment",
          value: equipmentBlock(equipments),
          inline: true,
        },
      )
      .setFooter({
        text: "Jasmine RPG",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (portrait) {
      embed.setImage(portrait);
    }

    return message.reply({ embeds: [embed] });
  },
  interaction: {
    data: slashCommand("profile", "View a character profile", (builder) =>
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
