const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  escapeMarkdown,
  inlineCode,
} = require("discord.js");
const constants = require("../constants");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const GOLD_COLOR = "#FBBF24";
const SHOP_COLOR = "#38BDF8";
const BATTLE_COLOR = "#DDA0DD";
const SUCCESS_COLOR = "#34D399";

const STAT_LABELS = {
  hp: "HP",
  str: "Strength",
  agl: "Agility",
  sta: "Stamina",
  acc: "Accuracy",
  eva: "Evasion",
  att: "Attack",
  def: "Defense",
  crit: "Crit",
};

const STAT_EMOJI = {
  hp: constants.assets.hp.emoji,
  str: constants.assets.str.emoji,
  agl: constants.assets.agl.emoji,
  sta: constants.assets.sta.emoji,
  acc: constants.assets.acc.emoji,
  eva: constants.assets.eva.emoji,
  att: constants.assets.att.emoji,
  def: constants.assets.def.emoji,
};

const TITLE_CASE = (value) =>
  String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function displayName(user) {
  const name =
    user?.globalName || user?.username || user?.displayName || "Unknown user";

  return escapeMarkdown(String(name).replace(/\s+/g, " ").trim());
}

function memberName(member) {
  const name =
    member?.displayName ||
    member?.user?.globalName ||
    member?.user?.username ||
    "Unknown member";

  return escapeMarkdown(String(name).replace(/\s+/g, " ").trim());
}

function avatarFor(user) {
  return typeof user?.displayAvatarURL === "function"
    ? user.displayAvatarURL({ size: 128 })
    : undefined;
}

function prefixFor(client, message) {
  return (
    (message.guild && client.prefixes.get(message.guild.id)) ||
    process.env.PREFIX ||
    "!"
  );
}

function errorEmbed(client, title, description, author = "Jasmine RPG") {
  return new EmbedBuilder()
    .setAuthor({
      name: author,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatCoins(value) {
  return `${constants.coins.emoji} ${formatNumber(value)}`;
}

function countLabel(count, singular, plural = `${singular}s`) {
  return `${formatNumber(count)} ${Number(count) === 1 ? singular : plural}`;
}

function formatStats(attributes) {
  return Object.entries(attributes || {})
    .map(([key, value]) => {
      const label = STAT_LABELS[key] || TITLE_CASE(key);
      const amount = Number(value);
      return `${label} ${amount > 0 ? "+" : ""}${amount}`;
    })
    .join(", ");
}

function progressBar(current, total, size = 10) {
  const max = Number(total) || 0;
  const value = Math.max(0, Math.min(Number(current) || 0, max));
  const ratio = max > 0 ? value / max : 0;
  const filled = Math.round(ratio * size);

  return `${"█".repeat(filled)}${"░".repeat(size - filled)} ${value} / ${max}`;
}

function formatDuration(remaining) {
  const days = Math.max(0, Math.floor(remaining.days || 0));
  const hours = Math.max(0, Math.floor(remaining.hours || 0));
  const minutes = Math.max(0, Math.floor(remaining.minutes || 0));
  const seconds = Math.max(0, Math.ceil(remaining.seconds || 0));
  const units = [];

  if (days) {
    units.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  if (hours) {
    units.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (minutes) {
    units.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  if (!days && !hours) {
    units.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return units.slice(0, 2).join(" ");
}

function commandHint(client, message, name, usage) {
  const prefix = message.isInteraction ? "/" : prefixFor(client, message);
  return inlineCode(`${prefix}${name}${usage ? ` ${usage}` : ""}`);
}

async function paginateEmbeds(message, pages, options = {}) {
  const time = options.time || 180_000;
  const ownerId = message.author?.id || message.user?.id;
  let page = 0;

  const buildRow = () =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rpg:page:previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("rpg:page:next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === pages.length - 1),
      new ButtonBuilder()
        .setCustomId("rpg:page:close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger),
    );

  const sent = await message.reply({
    embeds: [pages[page]],
    components: pages.length > 1 ? [buildRow()] : [],
  });

  if (pages.length < 2) {
    return sent;
  }

  const collector = sent.createMessageComponentCollector({
    time,
    filter: (interaction) => interaction.user.id === ownerId,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "rpg:page:close") {
      collector.stop("closed");
      return interaction.update({ components: [] }).catch(() => null);
    }

    page += interaction.customId === "rpg:page:next" ? 1 : -1;
    page = Math.max(0, Math.min(page, pages.length - 1));

    return interaction
      .update({
        embeds: [pages[page]],
        components: [buildRow()],
      })
      .catch(() => null);
  });

  collector.on("end", async (collected, reason) => {
    if (reason === "time") {
      await sent.edit({ components: [] }).catch(() => null);
    }
  });

  return sent;
}

module.exports = {
  BATTLE_COLOR,
  BRAND_COLOR,
  ERROR_COLOR,
  GOLD_COLOR,
  SHOP_COLOR,
  STAT_EMOJI,
  STAT_LABELS,
  SUCCESS_COLOR,
  TITLE_CASE,
  avatarFor,
  commandHint,
  countLabel,
  displayName,
  errorEmbed,
  formatCoins,
  formatDuration,
  formatNumber,
  formatStats,
  memberName,
  paginateEmbeds,
  prefixFor,
  progressBar,
};
