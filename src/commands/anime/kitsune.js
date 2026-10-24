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

const API_URL = "https://nekos.best/api/v2/kitsune";
const DEFAULT_COUNT = 1;
const MAX_COUNT = 5;
const REQUEST_TIMEOUT = 15_000;
const MENU_TIMEOUT = 120_000;
const BRAND_COLOR = "#CD1C6C";
const ANOTHER_ID = "kitsune:another";
const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";

async function fetchImages(count) {
  const response = await axios.get(API_URL, {
    params: { amount: count },
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const images = Array.isArray(response.data?.results)
    ? response.data.results.filter((image) => image?.url)
    : [];

  if (!images.length) {
    const error = new Error("nekos.best returned no images");
    error.code = "EMPTY_RESPONSE";
    throw error;
  }

  return images.slice(0, count);
}

function creditFor(image) {
  const parts = [];

  if (image.artist_name) {
    const artist = escapeMarkdown(image.artist_name);
    parts.push(
      image.artist_href
        ? `Art by [${artist}](${image.artist_href})`
        : `Art by ${artist}`,
    );
  }

  if (image.source_url) {
    parts.push(`[Source](${image.source_url})`);
  }

  return parts.length ? `-# ${parts.join(" • ")}` : null;
}

function buildEmbed(client, image, { first, total }) {
  const embed = new EmbedBuilder().setColor(BRAND_COLOR).setImage(image.url);

  if (first) {
    embed
      .setAuthor({
        name: "Kitsune",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle(total === 1 ? "A random kitsune" : `${total} kitsune images`)
      .setTimestamp();
  }

  const dimensions = image.dimensions;
  const footer = [];

  if (dimensions?.width && dimensions?.height) {
    footer.push(`${dimensions.width} × ${dimensions.height}`);
  }

  footer.push("nekos.best");
  embed.setFooter({ text: footer.join(" • ") });

  const credit = creditFor(image);
  if (credit) {
    embed.setDescription(credit);
  }

  return embed;
}

function buildErrorEmbed(client, error, count) {
  const plural = count > 1;
  const status = error.response?.status;
  const description =
    status === 429
      ? "nekos.best is limiting requests right now. Try again in a minute."
      : error.code === "EMPTY_RESPONSE"
        ? `nekos.best returned no ${
            plural ? "images" : "image"
          }. Try again in a moment.`
        : "nekos.best did not respond. Try again in a moment.";

  return new EmbedBuilder()
    .setAuthor({
      name: "Kitsune",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setTitle(plural ? "Images unavailable" : "Image unavailable")
    .setDescription(description)
    .setTimestamp();
}

function buildButtons(images, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ANOTHER_ID)
      .setLabel(images.length > 1 ? "Send another set" : "Send another image")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  if (images.length === 1) {
    const [image] = images;

    if (image.artist_href) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Artist")
          .setStyle(ButtonStyle.Link)
          .setURL(image.artist_href),
      );
    }

    if (image.source_url) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Source")
          .setStyle(ButtonStyle.Link)
          .setURL(image.source_url),
      );
    }
  }

  return row;
}

function attachButtons(
  client,
  message,
  { images, count, ownerId, commandLabel },
) {
  let current = images;

  const collector = message.createMessageComponentCollector({
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      const noun = current.length === 1 ? "image" : "images";

      await interaction
        .reply({
          content: `Only the person who ran the command can use these buttons. Run ${commandLabel} to get your own ${noun}.`,
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
      current = await fetchImages(count);
      await interaction.editReply({
        embeds: current.map((image, index) =>
          buildEmbed(client, image, {
            first: index === 0,
            total: current.length,
          }),
        ),
        components: [buildButtons(current)],
      });
    } catch (error) {
      signale.warn(
        `Kitsune refresh failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
      );
      await interaction
        .followUp({
          content:
            count > 1
              ? "Could not load another set of images. Try again in a moment."
              : "Could not load another image. Try again in a moment.",
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

async function deliver(client, send, { count, ownerId, commandLabel }) {
  let images;

  try {
    images = await fetchImages(count);
  } catch (error) {
    signale.warn(
      `Kitsune request failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );
    return send({ embeds: [buildErrorEmbed(client, error, count)] });
  }

  const embeds = images.map((image, index) =>
    buildEmbed(client, image, { first: index === 0, total: images.length }),
  );

  const sent = await send({
    embeds,
    components: [buildButtons(images)],
  });

  if (sent?.createMessageComponentCollector) {
    attachButtons(client, sent, { images, count, ownerId, commandLabel });
  }

  return sent;
}

function parseCount(args) {
  if (!args.length) {
    return DEFAULT_COUNT;
  }

  if (args.length > 1) {
    return null;
  }

  const count = Number(args[0]);
  return Number.isInteger(count) && count >= 1 && count <= MAX_COUNT
    ? count
    : null;
}

module.exports = {
  name: "kitsune",
  aliases: ["fox"],
  category: "anime",
  description: "Send random kitsune images",
  usage: "[count]",
  run: async (client, message, args) => {
    const count = parseCount(args);

    if (!count) {
      return message.reply(`Choose a count from 1 to ${MAX_COUNT}.`);
    }

    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";

    return deliver(client, (payload) => message.reply(payload), {
      count,
      ownerId: message.author.id,
      commandLabel: `\`${prefix}kitsune\``,
    });
  },
  interaction: {
    data: {
      name: "kitsune",
      type: 1,
      description: "Send random kitsune images",
      options: [
        {
          name: "count",
          type: 4,
          description: "How many images to send",
          required: false,
          min_value: 1,
          max_value: MAX_COUNT,
        },
      ],
    },
    run: async (client, interaction) => {
      const count = interaction.options.getInteger("count") ?? DEFAULT_COUNT;

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        count,
        ownerId: interaction.user.id,
        commandLabel: "`/kitsune`",
      });
    },
  },
};
