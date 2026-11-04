const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const schemas = require("../../database/schemas");
const characters = require("../../database/json/characters.json");
const economies = require("../../utils/economies");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");
const { parseImages } = require("../../utils/rpg/data");
const {
  GOLD_COLOR,
  SUCCESS_COLOR,
  avatarFor,
  commandHint,
  countLabel,
  displayName,
  errorEmbed,
  formatCoins,
} = require("../../utils/rpg/ui");

module.exports = {
  name: "hunt",
  description: "Find a random character",
  category: "rpg",
  run: async (client, message) => {
    const userCharacter = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!userCharacter) {
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
            )} to start hunting.`,
          ),
        ],
      });
    }

    const characterKeys = Object.keys(characters);
    const characterKey =
      characterKeys[Math.floor(Math.random() * characterKeys.length)];
    const character = characters[characterKey];
    const images = parseImages(userCharacter.get("images"));
    const name = escapeMarkdown(character.name);

    if (images.includes(characterKey)) {
      const coins = await economies.getCoins(message.author);

      await schemas
        .coins()
        .update(
          { wallet: coins.get("wallet") + 20 },
          { where: { userID: message.author.id } },
        );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: displayName(message.author),
              iconURL: avatarFor(message.author),
            })
            .setColor(GOLD_COLOR)
            .setTitle("Duplicate character")
            .setDescription(
              `${name} is already in your collection. You received ${formatCoins(
                20,
              )} for the duplicate.`,
            )
            .setImage(character.image)
            .setFooter({
              text: `Collection: ${countLabel(images.length, "character")}`,
              iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    }

    images.push(characterKey);

    await schemas
      .character()
      .update(
        { images: JSON.stringify(images) },
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
          .setTitle("New character")
          .setDescription(`${name} joined your collection.`)
          .setImage(character.image)
          .setFooter({
            text: `${countLabel(
              images.length,
              "character",
            )} collected. View your collection with ${commandHint(
              client,
              message,
              "image",
            )}.`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("hunt", "Find a random character"),
    run: async (client, interaction) =>
      runPrefixCommand(client, interaction, module.exports),
  },
};
