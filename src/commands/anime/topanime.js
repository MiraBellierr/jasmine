const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const signale = require("signale");
const anilist = require("../../utils/anilist");
const { argsError } = require("../../utils/errors");

const RESULT_LIMIT = 10;

const TYPES = {
  anime: {
    label: "Anime",
    color: "#F472B6",
    url: "https://anilist.co/search/anime?sort=SCORE_DESC",
  },
  manga: {
    label: "Manga",
    color: "#A78BFA",
    url: "https://anilist.co/search/manga?sort=SCORE_DESC",
  },
  characters: {
    label: "Characters",
    color: "#38BDF8",
    url: "https://anilist.co/search/character?sort=FAVOURITES_DESC",
  },
};

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const truncate = (value, max) => {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
};

const compactNumber = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? compactFormatter.format(value)
    : null;

const compactLabel = (value, singular, plural = `${singular}s`) => {
  const formatted = compactNumber(value);
  return formatted ? `${formatted} ${value === 1 ? singular : plural}` : null;
};

const normalizeType = (value) => {
  const type = String(value || "")
    .toLowerCase()
    .replace(/^--/, "");

  if (!type || type === "anime") {
    return "anime";
  }

  if (type === "manga") {
    return "manga";
  }

  if (type === "character" || type === "characters") {
    return "characters";
  }

  return null;
};

const summary = (type, item) => {
  if (type === "characters") {
    return compactLabel(item.favorites, "favorite") || "";
  }

  return [
    typeof item.score === "number" ? `Score ${item.score.toFixed(2)}` : null,
    compactLabel(item.members, "member"),
    type === "anime" ? compactLabel(item.episodes, "episode") : null,
    type === "manga" ? compactLabel(item.chapters, "chapter") : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

const resultLine = (type, item, index) => {
  const title = truncate(
    escapeMarkdown(item.title || item.name || "Untitled"),
    100,
  );
  const label = item.url ? `[${title}](${item.url})` : title;
  const details = summary(type, item);

  return `**${index + 1}.** ${label}${details ? ` · ${details}` : ""}`;
};

function buildTopEmbed(client, type, results) {
  const meta = TYPES[type];
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "AniList · Rankings",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(meta.color)
    .setTitle(`Top ${results.length} ${meta.label}`)
    .setURL(meta.url)
    .setDescription(
      results.map((item, index) => resultLine(type, item, index)).join("\n"),
    )
    .setFooter({
      text: "Rankings from AniList",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  const image = results[0]?.image;
  if (image) {
    embed.setThumbnail(image);
  }

  return embed;
}

function buildNoResultsEmbed(client, type) {
  const category =
    type === "characters" ? "character" : TYPES[type].label.toLowerCase();

  return new EmbedBuilder()
    .setAuthor({
      name: "AniList · Rankings",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setTitle("No rankings available")
    .setDescription(
      `AniList returned no ${category} rankings. Try again in a moment.`,
    )
    .setTimestamp();
}

function buildErrorEmbed(client, error) {
  const status = error.response?.status;
  const description =
    status === 429
      ? "AniList is rate limiting requests. Try again in a minute."
      : "AniList did not answer. Try again in a moment.";

  return new EmbedBuilder()
    .setAuthor({
      name: "AniList",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setTitle("Rankings failed")
    .setDescription(description)
    .setTimestamp();
}

const loadingText = (type) =>
  `*Loading top ${TYPES[type].label.toLowerCase()}...*`;

async function showTop(client, message, type) {
  let results;

  try {
    results = await anilist.top(type, RESULT_LIMIT);
  } catch (error) {
    signale.warn(
      `AniList rankings failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );
    return message.edit({ embeds: [buildErrorEmbed(client, error)] });
  }

  if (!results.length) {
    return message.edit({ embeds: [buildNoResultsEmbed(client, type)] });
  }

  return message.edit({ embeds: [buildTopEmbed(client, type, results)] });
}

module.exports = {
  name: "topanime",
  aliases: ["top"],
  description: "Show the top anime, manga or characters on AniList",
  category: "anime",
  usage: "[anime | character | manga]",
  run: async (client, message, args) => {
    const type = normalizeType(args[0]);

    if (!type) {
      return argsError(module.exports, client, message);
    }

    const loading = await message.reply(loadingText(type));

    return showTop(client, loading, type);
  },
  interaction: {
    data: {
      name: "topanime",
      type: 1,
      description: "Show the top anime, manga or characters on AniList",
      options: [
        {
          name: "type",
          type: 3,
          description: "What to rank",
          required: false,
          choices: [
            { name: "Anime", value: "anime" },
            { name: "Manga", value: "manga" },
            { name: "Character", value: "characters" },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const type =
        normalizeType(interaction.options.getString("type")) || "anime";

      await interaction.deferReply();

      const loading = await interaction.editReply({
        content: loadingText(type),
      });

      return showTop(client, loading, type);
    },
  },
};
