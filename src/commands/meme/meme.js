const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  escapeMarkdown,
} = require("discord.js");
const axios = require("axios");
const signale = require("signale");

const API_URL = "https://meme-api.com/gimme";
const REQUEST_TIMEOUT = 15_000;
const MENU_TIMEOUT = 120_000;
const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const ANOTHER_ID = "meme:another";
const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";

const truncate = (value, max) =>
  String(value ?? "").length > max
    ? `${String(value).slice(0, max - 3)}...`
    : String(value ?? "");

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

function normalizeSubreddit(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\/?r\//i, "")
    .replace(/\/+$/g, "");
}

function isValidSubreddit(name) {
  return /^[A-Za-z0-9_]{3,21}$/.test(name);
}

async function requestMeme(subreddit) {
  const url = subreddit
    ? `${API_URL}/${encodeURIComponent(subreddit)}`
    : API_URL;
  const response = await axios.get(url, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  return response.data;
}

async function fetchMeme(subreddit, allowNsfw) {
  let nsfwError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const meme = await requestMeme(subreddit);

    if (!meme?.url) {
      const error = new Error("meme-api.com returned no meme");
      error.code = "EMPTY_RESPONSE";
      throw error;
    }

    if (meme.nsfw && !allowNsfw) {
      nsfwError = new Error("meme-api.com returned an NSFW meme");
      nsfwError.code = "NSFW";
      continue;
    }

    return meme;
  }

  throw nsfwError;
}

function formatScore(ups) {
  if (!Number.isFinite(ups)) {
    return "Score unknown";
  }

  return `${formatNumber(ups)} ${ups === 1 ? "upvote" : "upvotes"}`;
}

function buildEmbed(client, meme) {
  const title =
    truncate(
      String(meme.title ?? "")
        .replace(/\s+/g, " ")
        .trim(),
      256,
    ) || "Untitled meme";
  const subreddit = meme.subreddit ? `r/${meme.subreddit}` : "Reddit";
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Meme",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setImage(meme.url)
    .setFooter({
      text: `${subreddit} • ${formatScore(meme.ups)}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (meme.postLink) {
    embed.setURL(meme.postLink);
  }

  if (meme.author) {
    embed.setDescription(`Posted by u/${escapeMarkdown(meme.author)}`);
  }

  return embed;
}

function buildButtons(meme, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ANOTHER_ID)
      .setLabel("New meme")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  if (meme.postLink) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("View post")
        .setStyle(ButtonStyle.Link)
        .setURL(meme.postLink),
    );
  }

  return row;
}

function buildErrorEmbed(client, error, subreddit) {
  const status = error.response?.status;
  let title = "Meme unavailable";
  let description =
    "meme-api.com did not return a meme. Try again in a moment.";

  if (status === 404 && subreddit) {
    title = "Subreddit not found";
    description = `No memes came back from r/${subreddit}. Check the name and try again.`;
  } else if (status === 429) {
    description =
      "meme-api.com is limiting requests right now. Try again in a minute.";
  } else if (error.code === "EMPTY_RESPONSE") {
    description = "meme-api.com returned no meme. Try again in a moment.";
  } else if (error.code === "NSFW") {
    title = "No safe meme found";

    if (subreddit) {
      description = `r/${subreddit} returned only NSFW memes. Try another subreddit.`;
    } else {
      description =
        "meme-api.com returned only NSFW memes. Try again, or run this in an NSFW channel.";
    }
  }

  return new EmbedBuilder()
    .setAuthor({
      name: "Meme",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function invalidSubredditEmbed(client) {
  return new EmbedBuilder()
    .setAuthor({
      name: "Meme",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle("Invalid subreddit")
    .setDescription(
      "Use a name like `wholesomememes` or `r/wholesomememes`. Names can contain letters, numbers, and underscores.",
    )
    .setTimestamp();
}

function attachButtons(
  client,
  message,
  { meme, subreddit, allowNsfw, ownerId, commandLabel },
) {
  let current = meme;

  const collector = message.createMessageComponentCollector({
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction
        .reply({
          content: `Only the person who ran the command can use this button. Run ${commandLabel} to get your own meme.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return;
    }

    if (interaction.customId !== ANOTHER_ID) {
      return;
    }

    try {
      await interaction.deferUpdate();
      current = await fetchMeme(subreddit, allowNsfw);
      await interaction.editReply({
        embeds: [buildEmbed(client, current)],
        components: [buildButtons(current)],
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      signale.warn(
        `Meme refresh failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
      );
      await interaction
        .followUp({
          content: "Could not load another meme. Try again in a moment.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
    }
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({ components: [buildButtons(current, true)] });
    } catch {
      // The message is gone, or the bot cannot edit it anymore.
    }
  });

  return collector;
}

async function deliver(
  client,
  send,
  { subreddit, allowNsfw, ownerId, commandLabel },
) {
  let meme;

  try {
    meme = await fetchMeme(subreddit, allowNsfw);
  } catch (error) {
    signale.warn(
      `Meme request failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );
    return send({ embeds: [buildErrorEmbed(client, error, subreddit)] });
  }

  const sent = await send({
    embeds: [buildEmbed(client, meme)],
    components: [buildButtons(meme)],
    allowedMentions: { parse: [] },
  });

  if (sent?.createMessageComponentCollector) {
    attachButtons(client, sent, {
      meme,
      subreddit,
      allowNsfw,
      ownerId,
      commandLabel,
    });
  }

  return sent;
}

function validateSubreddit(value) {
  if (!value) {
    return null;
  }

  const name = normalizeSubreddit(value);
  return isValidSubreddit(name) ? name : undefined;
}

module.exports = {
  name: "meme",
  aliases: ["memes"],
  category: "meme",
  description: "Send a random meme from Reddit",
  usage: "[subreddit]",
  run: async (client, message, args) => {
    const input = args.join(" ").trim();
    const subreddit = validateSubreddit(input);

    if (subreddit === undefined) {
      return message.reply({ embeds: [invalidSubredditEmbed(client)] });
    }

    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";

    return deliver(client, (payload) => message.reply(payload), {
      subreddit,
      allowNsfw: Boolean(message.channel?.nsfw),
      ownerId: message.author.id,
      commandLabel: `\`${prefix}meme\``,
    });
  },
  interaction: {
    data: {
      name: "meme",
      type: 1,
      description: "Send a random meme from Reddit",
      options: [
        {
          name: "subreddit",
          type: 3,
          description:
            "Subreddit to pick memes from. Leave blank for a random one.",
          required: false,
        },
      ],
    },
    run: async (client, interaction) => {
      const input = interaction.options.getString("subreddit");
      const subreddit = validateSubreddit(input);

      if (subreddit === undefined) {
        return interaction.reply({
          embeds: [invalidSubredditEmbed(client)],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        subreddit,
        allowNsfw: Boolean(interaction.channel?.nsfw),
        ownerId: interaction.user.id,
        commandLabel: "`/meme`",
      });
    },
  },
};
