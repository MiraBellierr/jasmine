const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  inlineCode,
} = require("discord.js");
const signale = require("signale");
const { randomQuote } = require("../../utils/quotes");

const MENU_TIMEOUT = 120_000;
const MAX_FILTER_LENGTH = 100;
const BRAND_COLOR = "#CD1C6C";
const ANOTHER_ID = "quote:another";

function normalizeFilter(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.replace(/^"(.+)"$/, "$1").trim();
}

function asBlockquote(text) {
  return String(text)
    .split("\n")
    .map((line) => `> ${line.replace(/\s+/g, " ").trim()}`)
    .join("\n");
}

function buildEmbed(client, quote) {
  const character = quote.character || "Unknown character";
  const anime = quote.anime || "Unknown anime";

  return new EmbedBuilder()
    .setAuthor({
      name: "Quote",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(character)
    .setDescription(asBlockquote(quote.content))
    .setFooter({ text: `Anime • ${anime}` })
    .setTimestamp();
}

function buildErrorEmbed(client, { filter, commandLabel }) {
  const description = filter
    ? `No quotes match ${inlineCode(
        filter,
      )}. Try a different anime, or run ${commandLabel} to get any quote.`
    : "The quote library is empty.";

  return new EmbedBuilder()
    .setAuthor({
      name: "Quote",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setTitle(filter ? "No quotes found" : "No quotes available")
    .setDescription(description)
    .setTimestamp();
}

function buildButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ANOTHER_ID)
      .setLabel("Another quote")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );
}

function attachButtons(
  client,
  message,
  { filter, ownerId, commandLabel, quote },
) {
  let current = quote;

  const collector = message.createMessageComponentCollector({
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction
        .reply({
          content: `Only the person who ran the command can use this button. Run ${commandLabel} to get your own quote.`,
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
      const next = randomQuote(filter, current.content);

      if (!next) {
        await interaction
          .followUp({
            content: filter
              ? `No other quote matches ${inlineCode(filter)}.`
              : "No other quote is available.",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => null);
        return;
      }

      current = next;
      await interaction.editReply({
        embeds: [buildEmbed(client, current)],
        components: [buildButtons()],
      });
    } catch (error) {
      signale.warn(`Quote refresh failed: ${error.message}`);
      await interaction
        .followUp({
          content: "Could not show another quote. Try again.",
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
      await message.edit({ components: [buildButtons(true)] });
    } catch {
      // The message is gone, or the bot cannot edit it anymore.
    }
  });

  return collector;
}

async function deliver(client, send, { filter, ownerId, commandLabel }) {
  const quote = randomQuote(filter);

  if (!quote) {
    return send({
      embeds: [buildErrorEmbed(client, { filter, commandLabel })],
    });
  }

  const sent = await send({
    embeds: [buildEmbed(client, quote)],
    components: [buildButtons()],
  });

  if (sent?.createMessageComponentCollector) {
    attachButtons(client, sent, { filter, ownerId, commandLabel, quote });
  }

  return sent;
}

const tooLong = (filter) => filter.length > MAX_FILTER_LENGTH;

module.exports = {
  name: "quote",
  aliases: ["q"],
  category: "anime",
  description: "Send a random anime quote",
  usage: "[anime]",
  run: async (client, message, args) => {
    const filter = normalizeFilter(args.join(" "));

    if (tooLong(filter)) {
      return message.reply(
        `Keep the anime name under ${MAX_FILTER_LENGTH} characters.`,
      );
    }

    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";

    return deliver(client, (payload) => message.reply(payload), {
      filter,
      ownerId: message.author.id,
      commandLabel: `\`${prefix}quote\``,
    });
  },
  interaction: {
    data: {
      name: "quote",
      type: 1,
      description: "Send a random anime quote",
      options: [
        {
          name: "anime",
          type: 3,
          description: "Anime to get quotes from",
          required: false,
          max_length: MAX_FILTER_LENGTH,
        },
      ],
    },
    run: async (client, interaction) => {
      const filter = normalizeFilter(interaction.options.getString("anime"));

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        filter,
        ownerId: interaction.user.id,
        commandLabel: "`/quote`",
      });
    },
  },
};
