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
const { getUserFromArguments } = require("../../utils/getters");

const API_URL = "https://nekos.best/api/v2/husbando";
const REQUEST_TIMEOUT = 15_000;
const MENU_TIMEOUT = 120_000;
const BRAND_COLOR = "#CD1C6C";
const ANOTHER_ID = "husbando:another";
const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";

const displayName = (user) => user?.user?.username || user?.username || null;

async function fetchImage() {
  const response = await axios.get(API_URL, {
    params: { amount: 1 },
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const image = response.data?.results?.[0];

  if (!image?.url) {
    const error = new Error("nekos.best returned no image");
    error.code = "EMPTY_RESPONSE";
    throw error;
  }

  return image;
}

function buildEmbed(client, image, target) {
  const name = displayName(target);
  const credits = [];

  if (image.artist_name) {
    const artist = escapeMarkdown(image.artist_name);
    credits.push(
      image.artist_href
        ? `Art by [${artist}](${image.artist_href})`
        : `Art by ${artist}`,
    );
  }

  if (image.source_url) {
    credits.push(`[Source](${image.source_url})`);
  }

  const dimensions = image.dimensions;
  const footer = [];

  if (dimensions?.width && dimensions?.height) {
    footer.push(`${dimensions.width} × ${dimensions.height}`);
  }

  footer.push("nekos.best");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Husbando",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(
      name ? `A husbando for ${escapeMarkdown(name)}` : "A random husbando",
    )
    .setImage(image.url)
    .setFooter({
      text: footer.join(" • "),
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (credits.length) {
    embed.setDescription(`-# ${credits.join(" • ")}`);
  }

  return embed;
}

function buildErrorEmbed(client, error) {
  const status = error.response?.status;
  const description =
    status === 429
      ? "nekos.best is limiting requests right now. Try again in a minute."
      : error.code === "EMPTY_RESPONSE"
        ? "nekos.best returned no image. Try again in a moment."
        : "nekos.best did not respond. Try again in a moment.";

  return new EmbedBuilder()
    .setAuthor({
      name: "Husbando",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setTitle("Image unavailable")
    .setDescription(description)
    .setTimestamp();
}

function buildButtons(image, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ANOTHER_ID)
      .setLabel("Send another image")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

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

  return row;
}

function attachButtons(
  client,
  message,
  { image, ownerId, target, commandLabel },
) {
  let current = image;

  const collector = message.createMessageComponentCollector({
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction
        .reply({
          content: `Only the person who ran the command can use these buttons. Run ${commandLabel} to get your own image.`,
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
      current = await fetchImage();
      await interaction.editReply({
        embeds: [buildEmbed(client, current, target)],
        components: [buildButtons(current)],
      });
    } catch (error) {
      signale.warn(
        `Husbando refresh failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
      );
      await interaction
        .followUp({
          content: "Could not load another image. Try again in a moment.",
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

async function deliver(client, send, { target, ownerId, commandLabel }) {
  let image;

  try {
    image = await fetchImage();
  } catch (error) {
    signale.warn(
      `Husbando request failed (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );
    return send({ embeds: [buildErrorEmbed(client, error)] });
  }

  const sent = await send({
    embeds: [buildEmbed(client, image, target)],
    components: [buildButtons(image)],
  });

  if (sent?.createMessageComponentCollector) {
    attachButtons(client, sent, { image, ownerId, target, commandLabel });
  }

  return sent;
}

async function resolveTarget(message, input) {
  if (!input) {
    return null;
  }

  return getUserFromArguments(message, input);
}

module.exports = {
  name: "husbando",
  aliases: ["hb"],
  category: "anime",
  description: "Send a random husbando image",
  usage: "[@user]",
  run: async (client, message, args) => {
    const input = args.join(" ").trim();
    const target = await resolveTarget(message, input);

    if (input && !target) {
      return message.reply(
        "I couldn't find that user. Mention the user or enter their user ID.",
      );
    }

    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";

    return deliver(client, (payload) => message.reply(payload), {
      target,
      ownerId: message.author.id,
      commandLabel: `\`${prefix}husbando\``,
    });
  },
  interaction: {
    data: {
      name: "husbando",
      type: 1,
      description: "Send a random husbando image",
      options: [
        {
          name: "user",
          type: 6,
          description: "Show a husbando for the selected user",
          required: false,
        },
      ],
    },
    run: async (client, interaction) => {
      const target = interaction.options.getUser("user");

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        target,
        ownerId: interaction.user.id,
        commandLabel: "`/husbando`",
      });
    },
  },
};
