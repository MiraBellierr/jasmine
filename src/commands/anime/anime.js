const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  escapeMarkdown,
} = require("discord.js");
const moment = require("moment");
const signale = require("signale");
const anilist = require("../../utils/anilist");
const { argsError } = require("../../utils/errors");

const RESULT_LIMIT = 8;
const MENU_TIMEOUT = 120_000;

const COLORS = {
  anime: "#F472B6",
  manga: "#A78BFA",
  characters: "#38BDF8",
  error: "#EF4444",
};

const TYPE_LABEL = {
  anime: "Anime",
  manga: "Manga",
  characters: "Character",
};

const TYPE_FLAG = /--(anime|characters?|manga)\b/gi;

const normalizeType = (value) => {
  const type = String(value || "").toLowerCase();

  if (type === "character" || type === "characters") {
    return "characters";
  }

  if (type === "manga") {
    return "manga";
  }

  return "anime";
};

const truncate = (value, max) => {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
};

const descriptionText = (value, fallback, max = 1800) => {
  const text = truncate(value, max);
  return text && !/^No (synopsis|biography)/i.test(text) ? text : fallback;
};

const formatNumber = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US")
    : null;

const countLabel = (value, singular, plural = `${singular}s`) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  const text = String(value);
  if (/^\d{4}$/.test(text)) {
    return text;
  }

  const date = moment(text);
  return date.isValid() ? date.format("MMM D, YYYY") : null;
};

const formatYear = (value) => {
  if (!value) {
    return null;
  }

  const date = moment(value);
  return date.isValid() ? date.format("YYYY") : null;
};

const formatRange = (from, to) => {
  const start = formatDate(from);
  const end = formatDate(to);

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `From ${start}`;
  }

  if (end) {
    return `Until ${end}`;
  }

  return "Unknown";
};

const formatScore = (item) =>
  typeof item.score === "number"
    ? `${item.score.toFixed(2)} / 10`
    : "Not rated";

const joinList = (values, max = 1024) => {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];

  if (!list.length) {
    return null;
  }

  return truncate(list.join(", "), max);
};

const joinAppearances = (entries, key, max = 1024) => {
  const values = (Array.isArray(entries) ? entries : [])
    .slice(0, 5)
    .map((entry) => {
      const media = entry[key];
      const title = media?.title || media?.name;

      if (!title) {
        return null;
      }

      return entry.role
        ? `${escapeMarkdown(title)} (${entry.role})`
        : escapeMarkdown(title);
    })
    .filter(Boolean);

  return joinList(values, max);
};

const resultUrl = (item) => item.url || null;

const summary = (type, item) => {
  if (type === "characters") {
    return countLabel(item.favorites, "favorite") || "";
  }

  if (type === "manga") {
    return [
      item.type,
      countLabel(item.chapters, "chapter"),
      typeof item.score === "number" ? `Score ${item.score.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return [
    item.type,
    countLabel(item.episodes, "episode"),
    formatYear(item.aired?.from),
    typeof item.score === "number" ? `Score ${item.score.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

const resultLine = (type, item, index) => {
  const title = truncate(
    escapeMarkdown(item.title || item.name || "Untitled"),
    120,
  );
  const url = resultUrl(item);
  const label = url ? `[${title}](${url})` : title;
  const details = summary(type, item);

  return `**${index + 1}.** ${label}${details ? ` · ${details}` : ""}`;
};

function baseEmbed(client, type, item) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `AniList · ${TYPE_LABEL[type]}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(COLORS[type])
    .setTitle(
      truncate(escapeMarkdown(item.title || item.name || "Untitled"), 256),
    )
    .setTimestamp()
    .setFooter({
      text: `AniList ID ${item.id}`,
      iconURL: client.user.displayAvatarURL(),
    });

  if (item.url) {
    embed.setURL(item.url);
  }

  const image = item.image;
  if (image) {
    embed.setImage(image);
  }

  return embed;
}

function buildAnimeEmbed(client, anime) {
  const embed = baseEmbed(client, "anime", anime).setDescription(
    descriptionText(anime.synopsis, "No synopsis available."),
  );

  const fields = [
    { name: "Type", value: anime.type || "Unknown", inline: true },
    {
      name: "Episodes",
      value: anime.episodes ? String(anime.episodes) : "Unknown",
      inline: true,
    },
    { name: "Status", value: anime.status || "Unknown", inline: true },
    { name: "Score", value: formatScore(anime), inline: true },
    {
      name: "Aired",
      value: formatRange(anime.aired?.from, anime.aired?.to),
      inline: true,
    },
    { name: "Duration", value: anime.duration || "Unknown", inline: true },
    {
      name: "Studios",
      value:
        joinList((anime.studios || []).map((studio) => studio.name)) ||
        "Unknown",
      inline: true,
    },
    {
      name: "Genres",
      value:
        joinList((anime.genres || []).map((genre) => genre.name)) || "Unknown",
      inline: true,
    },
    {
      name: "Members",
      value: formatNumber(anime.members) || "Unknown",
      inline: true,
    },
    {
      name: "Favorites",
      value: formatNumber(anime.favorites) || "Unknown",
      inline: true,
    },
  ];

  return embed.addFields(fields);
}

function buildMangaEmbed(client, manga) {
  const embed = baseEmbed(client, "manga", manga).setDescription(
    descriptionText(manga.synopsis, "No synopsis available."),
  );

  const fields = [
    { name: "Type", value: manga.type || "Unknown", inline: true },
    {
      name: "Chapters",
      value: manga.chapters ? String(manga.chapters) : "Unknown",
      inline: true,
    },
    {
      name: "Volumes",
      value: manga.volumes ? String(manga.volumes) : "Unknown",
      inline: true,
    },
    { name: "Status", value: manga.status || "Unknown", inline: true },
    { name: "Score", value: formatScore(manga), inline: true },
    {
      name: "Published",
      value: formatRange(manga.published?.from, manga.published?.to),
      inline: true,
    },
    {
      name: "Authors",
      value:
        joinList((manga.authors || []).map((author) => author.name)) ||
        "Unknown",
      inline: true,
    },
    {
      name: "Genres",
      value:
        joinList((manga.genres || []).map((genre) => genre.name)) || "Unknown",
      inline: true,
    },
    {
      name: "Members",
      value: formatNumber(manga.members) || "Unknown",
      inline: true,
    },
    {
      name: "Favorites",
      value: formatNumber(manga.favorites) || "Unknown",
      inline: true,
    },
  ];

  return embed.addFields(fields);
}

function buildCharacterEmbed(client, character) {
  const embed = baseEmbed(client, "characters", character).setDescription(
    descriptionText(character.about, "No biography available.", 1200),
  );

  embed.addFields([
    {
      name: "Native name",
      value: truncate(character.nameNative, 200) || "Unknown",
      inline: true,
    },
    {
      name: "Favorites",
      value: formatNumber(character.favorites) || "Unknown",
      inline: true,
    },
  ]);

  const nicknames = joinList(character.nicknames, 300);
  if (nicknames) {
    embed.addFields({ name: "Nicknames", value: nicknames });
  }

  const anime = joinAppearances(character.anime, "anime", 600);
  if (anime) {
    embed.addFields({ name: "Anime appearances", value: anime });
  }

  const manga = joinAppearances(character.manga, "manga", 600);
  if (manga) {
    embed.addFields({ name: "Manga appearances", value: manga });
  }

  return embed;
}

function buildDetailEmbed(client, type, item) {
  if (type === "characters") {
    return buildCharacterEmbed(client, item);
  }

  if (type === "manga") {
    return buildMangaEmbed(client, item);
  }

  return buildAnimeEmbed(client, item);
}

function buildResultsEmbed(client, type, query, results) {
  return new EmbedBuilder()
    .setAuthor({
      name: `AniList · ${TYPE_LABEL[type]}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(COLORS[type])
    .setTitle(
      `${TYPE_LABEL[type]} results for "${truncate(
        escapeMarkdown(query),
        80,
      )}"`,
    )
    .setDescription(
      results.map((item, index) => resultLine(type, item, index)).join("\n"),
    )
    .setFooter({
      text: `${results.length} results · Choose one from the menu`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();
}

function buildNoResultsEmbed(client, type, query) {
  const label = TYPE_LABEL[type].toLowerCase();

  return new EmbedBuilder()
    .setAuthor({
      name: `AniList · ${TYPE_LABEL[type]}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(COLORS.error)
    .setTitle(`No ${label} found`)
    .setDescription(
      `Nothing on AniList matched "${truncate(
        escapeMarkdown(query),
        100,
      )}".\nTry a different spelling or another type.`,
    )
    .setTimestamp();
}

function buildErrorEmbed(client, error) {
  const status = error.response?.status;
  const description =
    status === 429
      ? "AniList is limiting requests right now. Try again in a minute."
      : "AniList did not answer. Try again in a moment.";

  return new EmbedBuilder()
    .setAuthor({
      name: "AniList",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(COLORS.error)
    .setTitle("Search failed")
    .setDescription(description)
    .setTimestamp();
}

function buildSelect(type, results, selectedId, disabled = false) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("anime:select")
    .setPlaceholder(selectedId ? "Choose another result" : "Choose a result")
    .setDisabled(disabled);

  menu.addOptions(
    results.map((item) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(
          truncate(escapeMarkdown(item.title || item.name || "Untitled"), 100),
        )
        .setDescription(truncate(summary(type, item) || "Open details", 100))
        .setValue(String(item.id))
        .setDefault(String(item.id) === String(selectedId)),
    ),
  );

  return menu;
}

function buildDetailButtons(url, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("anime:results")
      .setLabel("All results")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  if (url) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("View on AniList")
        .setStyle(ButtonStyle.Link)
        .setURL(url),
    );
  }

  return row;
}

function viewPayload(client, type, query, results, view, disabled = false) {
  const embed =
    view.kind === "detail"
      ? buildDetailEmbed(client, type, view.item)
      : buildResultsEmbed(client, type, query, results);
  const components = [];

  if (results.length > 1) {
    components.push(
      new ActionRowBuilder().addComponents(
        buildSelect(type, results, view.item?.id, disabled),
      ),
    );
  }

  if (view.kind === "detail" && results.length > 1) {
    components.push(buildDetailButtons(view.item.url, disabled));
  }

  return { embeds: [embed], components };
}

function attachBrowser(client, message, { type, query, results, userId }) {
  let view = { kind: "results", item: null };

  const collector = message.createMessageComponentCollector({
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== userId) {
      await interaction
        .reply({
          content:
            "This search belongs to someone else. Run the command to start your own search.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return;
    }

    try {
      if (interaction.isStringSelectMenu()) {
        const item = results.find(
          (result) => String(result.id) === interaction.values[0],
        );

        if (!item) {
          return interaction
            .reply({
              content: "That result is no longer available.",
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => null);
        }

        view = { kind: "detail", item };
        await interaction.update(
          viewPayload(client, type, query, results, view),
        );
        return;
      }

      if (interaction.isButton() && interaction.customId === "anime:results") {
        view = { kind: "results", item: null };
        await interaction.update(
          viewPayload(client, type, query, results, view),
        );
      }
    } catch {
      collector.stop();
    }
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit(viewPayload(client, type, query, results, view, true));
    } catch {
      // The message was deleted or can no longer be edited.
    }
  });
}

function parseArgs(args) {
  const input = args.join(" ").trim();
  const matches = [...input.matchAll(TYPE_FLAG)];
  const type = matches.length
    ? normalizeType(matches[matches.length - 1][1])
    : "anime";
  const query = input.replace(TYPE_FLAG, " ").replace(/\s+/g, " ").trim();

  return { type, query };
}

async function showResults(client, message, { type, query, userId }) {
  let results;

  try {
    results = await anilist.search(type, query, RESULT_LIMIT);
  } catch (error) {
    signale.warn(
      `Anime search failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );
    return message.edit({ embeds: [buildErrorEmbed(client, error)] });
  }

  if (!results.length) {
    return message.edit({ embeds: [buildNoResultsEmbed(client, type, query)] });
  }

  const initialView =
    results.length === 1
      ? { kind: "detail", item: results[0] }
      : { kind: "results", item: null };

  await message.edit(viewPayload(client, type, query, results, initialView));

  if (results.length > 1) {
    attachBrowser(client, message, { type, query, results, userId });
  }
}

module.exports = {
  name: "anime",
  description: "Search anime, manga or characters on AniList",
  category: "anime",
  usage: "<title> [--anime | --character | --manga]",
  run: async (client, message, args) => {
    const { type, query } = parseArgs(args);

    if (!query) {
      return argsError(module.exports, client, message);
    }

    const loading = await message.reply("*Searching AniList...*");

    return showResults(client, loading, {
      type,
      query,
      userId: message.author.id,
    });
  },
  interaction: {
    data: {
      name: "anime",
      type: 1,
      description: "Search anime, manga or characters on AniList",
      options: [
        {
          name: "query",
          type: 3,
          description: "Title or character name to search for",
          required: true,
          max_length: 100,
        },
        {
          name: "type",
          type: 3,
          description: "Anime, manga, or character",
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
      const query = interaction.options
        .getString("query")
        ?.replace(/\s+/g, " ")
        .trim();
      const type = normalizeType(
        interaction.options.getString("type") || "anime",
      );

      if (!query) {
        return interaction.reply({
          content: "Enter a title or character name to search for.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      const loading = await interaction.editReply({
        content: "*Searching AniList...*",
      });

      return showResults(client, loading, {
        type,
        query,
        userId: interaction.user.id,
      });
    },
  },
};
