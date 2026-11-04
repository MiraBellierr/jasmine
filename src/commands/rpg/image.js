const { EmbedBuilder, escapeMarkdown, inlineCode } = require("discord.js");
const schemas = require("../../database/schemas");
const characters = require("../../database/json/characters.json");
const {
  runPrefixCommand,
  slashCommand,
  textOption,
} = require("../../utils/slashCommands");
const { parseImages } = require("../../utils/rpg/data");
const {
  BRAND_COLOR,
  SUCCESS_COLOR,
  avatarFor,
  commandHint,
  countLabel,
  displayName,
  errorEmbed,
  paginateEmbeds,
} = require("../../utils/rpg/ui");

const PAGE_SIZE = 10;

const collectionPages = (client, message, images) => {
  const lines = images.map(
    (id) =>
      `• [${escapeMarkdown(characters[id].name)}](${characters[id].image})`,
  );
  const pages = [];
  const totalPages = Math.ceil(lines.length / PAGE_SIZE);

  for (let index = 0; index < lines.length; index += PAGE_SIZE) {
    pages.push(
      new EmbedBuilder()
        .setAuthor({
          name: displayName(message.author),
          iconURL: avatarFor(message.author),
        })
        .setColor(BRAND_COLOR)
        .setTitle("Character collection")
        .setDescription(lines.slice(index, index + PAGE_SIZE).join("\n"))
        .setFooter({
          text: `Page ${pages.length + 1} of ${totalPages} · ${countLabel(
            images.length,
            "character",
          )}`,
          iconURL: client.user.displayAvatarURL(),
        }),
    );
  }

  return pages;
};

module.exports = {
  name: "image",
  description: "View or change your character",
  category: "rpg",
  usage: "[character]",
  run: async (client, message, args) => {
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
            )} to start collecting characters.`,
          ),
        ],
      });
    }

    const images = parseImages(userCharacter.get("images"));
    const query = args.join(" ").trim();

    if (!query) {
      if (!images.length) {
        return message.reply({
          embeds: [
            errorEmbed(
              client,
              "No characters yet",
              `You have not found any characters. Use ${commandHint(
                client,
                message,
                "hunt",
              )} to find one.`,
            ),
          ],
        });
      }

      return paginateEmbeds(message, collectionPages(client, message, images), {
        time: 180_000,
      });
    }

    const matches = Object.entries(characters)
      .filter(([, character]) =>
        character.name.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => {
        const aExact = a[1].name.toLowerCase() === query.toLowerCase();
        const bExact = b[1].name.toLowerCase() === query.toLowerCase();

        return Number(bExact) - Number(aExact);
      });

    if (!matches.length) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Character not found",
            `No character in the database matches ${inlineCode(
              query.slice(0, 80),
            )}.`,
          ),
        ],
      });
    }

    const owned = new Set(images);
    const match = matches.find(([id]) => owned.has(id));

    if (!match) {
      return message.reply({
        embeds: [
          errorEmbed(
            client,
            "Not in your collection",
            `You do not own a character matching ${inlineCode(
              query.slice(0, 80),
            )}. Use ${commandHint(
              client,
              message,
              "hunt",
            )} to find more characters.`,
          ),
        ],
      });
    }

    const [characterKey, character] = match;

    await schemas
      .character()
      .update(
        { img: characterKey, name: character.name },
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
          .setTitle("Character changed")
          .setDescription(
            `Your character is now ${escapeMarkdown(character.name)}.`,
          )
          .setImage(character.image)
          .setTimestamp(),
      ],
    });
  },
  interaction: {
    data: slashCommand("image", "View or change your character", (builder) =>
      builder.addStringOption((option) =>
        textOption(option, "character", "Character to use", false),
      ),
    ),
    run: async (client, interaction) => {
      const character = interaction.options.getString("character");

      return runPrefixCommand(
        client,
        interaction,
        module.exports,
        character ? [character] : [],
      );
    },
  },
};
