const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  escapeMarkdown,
} = require("discord.js");
const signale = require("signale");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_FIELD_LENGTH = 1000;

const VIEW_OVERVIEW = "overview";
const VIEW_SETTINGS = "settings";
const VIEW_FEATURES = "features";

const OVERVIEW_ID = "serverinfo:view:overview";
const SETTINGS_ID = "serverinfo:view:settings";
const FEATURES_ID = "serverinfo:view:features";

const VERIFICATION_LEVELS = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Very high",
};

const CONTENT_FILTERS = {
  0: "Disabled",
  1: "Members without roles",
  2: "All members",
};

const NOTIFICATION_LEVELS = {
  0: "All messages",
  1: "Only mentions",
};

const FEATURE_LABELS = {
  COMMUNITY: "Community server",
  DISCOVERABLE: "Listed in discovery",
  DISCOVERABLE_DISABLED: "Discovery disabled",
  ENABLED_DISCOVERABLE_BEFORE: "Discovery previously enabled",
  GUILD_TAGS: "Server tags",
  MEMBER_VERIFICATION_GATE_ENABLED: "Member verification",
  MEMBER_VERIFICATION_MANUAL_APPROVAL: "Manual member approval",
  MONETIZATION_ENABLED: "Monetization",
  NEWS: "Announcement channels",
  PREVIEW_ENABLED: "Server preview",
  TICKETED_EVENTS_ENABLED: "Ticketed events",
  VANITY_URL: "Vanity URL",
  WELCOME_SCREEN_ENABLED: "Welcome screen",
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

const yesNo = (value) => (value ? "Yes" : "No");

const formatTimestamp = (value) => `<t:${Math.floor(value / 1000)}:f>`;

function formatDuration(seconds) {
  if (!seconds) {
    return "None";
  }

  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}

function formatFeature(feature) {
  if (FEATURE_LABELS[feature]) {
    return FEATURE_LABELS[feature];
  }

  if (feature.startsWith("CREATOR_MONETIZABLE")) {
    return "Creator monetization";
  }

  if (feature.startsWith("ROLE_SUBSCRIPTIONS")) {
    return "Role subscriptions";
  }

  if (feature.startsWith("MAX_FILE_SIZE_")) {
    return `${feature.slice("MAX_FILE_SIZE_".length)} MB file uploads`;
  }

  const label = feature.toLowerCase().replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

async function collectInfo(guild) {
  if (guild.members.cache.size < guild.memberCount) {
    await guild.members.fetch().catch(() => null);
  }

  const complete = guild.members.cache.size >= guild.memberCount;
  const bots = complete
    ? guild.members.cache.filter((member) => member.user.bot).size
    : null;

  const text = guild.channels.cache.filter((channel) =>
    [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
      channel.type,
    ),
  ).size;
  const voice = guild.channels.cache.filter((channel) =>
    [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
      channel.type,
    ),
  ).size;
  const categories = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.GuildCategory,
  ).size;

  return {
    members: guild.memberCount,
    humans: bots === null ? null : Math.max(guild.memberCount - bots, 0),
    bots,
    boosts: guild.premiumSubscriptionCount ?? 0,
    tier: guild.premiumTier,
    text,
    voice,
    categories,
    channels: text + voice + categories,
    roles: guild.roles.cache.size,
    emojis: guild.emojis.cache.size,
    stickers: guild.stickers.cache.size,
  };
}

function formatBoosts({ boosts, tier }) {
  if (!boosts) {
    return "None";
  }

  return tier ? `${formatNumber(boosts)} (Tier ${tier})` : formatNumber(boosts);
}

function buildBaseEmbed(client, guild, { title, description, image }) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Server information",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setFooter({
      text: `Server ID ${guild.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  const thumbnail = guild.iconURL({ size: 256 });

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  if (description) {
    embed.setDescription(description);
  }

  if (image) {
    embed.setImage(image);
  }

  return embed;
}

function buildOverview(client, guild, info) {
  const humans = info.humans === null ? "Unknown" : formatNumber(info.humans);
  const bots = info.bots === null ? "Unknown" : formatNumber(info.bots);

  return buildBaseEmbed(client, guild, {
    title: escapeMarkdown(guild.name),
    description: guild.description || undefined,
    image: guild.bannerURL({ size: 1024 }),
  }).addFields(
    { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
    {
      name: "Created",
      value: formatTimestamp(guild.createdTimestamp),
      inline: true,
    },
    { name: "Members", value: formatNumber(info.members), inline: true },
    { name: "Humans", value: humans, inline: true },
    { name: "Bots", value: bots, inline: true },
    { name: "Boosts", value: formatBoosts(info), inline: true },
    {
      name: "Channels",
      value: `${formatNumber(info.channels)} total\n${formatNumber(
        info.text,
      )} text, ${formatNumber(info.voice)} voice, ${formatNumber(
        info.categories,
      )} categories`,
      inline: true,
    },
    { name: "Roles", value: formatNumber(info.roles), inline: true },
    {
      name: "Emojis and stickers",
      value: `${formatNumber(info.emojis)} emojis\n${formatNumber(
        info.stickers,
      )} stickers`,
      inline: true,
    },
  );
}

function buildSettings(client, guild) {
  const hasAfk = Boolean(guild.afkChannelId);

  return buildBaseEmbed(client, guild, {
    title: "Settings",
    description: escapeMarkdown(guild.name),
  }).addFields(
    {
      name: "Verification level",
      value: VERIFICATION_LEVELS[guild.verificationLevel] ?? "Unknown",
      inline: true,
    },
    {
      name: "Content filter",
      value: CONTENT_FILTERS[guild.explicitContentFilter] ?? "Unknown",
      inline: true,
    },
    {
      name: "Two-factor requirement",
      value: guild.mfaLevel === 0 ? "Not required" : "Required",
      inline: true,
    },
    {
      name: "Default notifications",
      value:
        NOTIFICATION_LEVELS[guild.defaultMessageNotifications] ?? "Unknown",
      inline: true,
    },
    {
      name: "AFK channel",
      value: hasAfk ? `<#${guild.afkChannelId}>` : "None",
      inline: true,
    },
    {
      name: "AFK timeout",
      value: hasAfk ? formatDuration(guild.afkTimeout) : "None",
      inline: true,
    },
    {
      name: "Vanity URL",
      value: guild.vanityURLCode
        ? `[discord.gg/${guild.vanityURLCode}](https://discord.gg/${guild.vanityURLCode})`
        : "None",
      inline: true,
    },
    { name: "Partnered", value: yesNo(guild.partnered), inline: true },
    { name: "Verified", value: yesNo(guild.verified), inline: true },
  );
}

function buildFeatureFields(features) {
  const lines = features.map((feature) => `• ${feature}`);
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;

    if (next.length > MAX_FIELD_LENGTH && current) {
      chunks.push(current);
      current = line;
      continue;
    }

    current = next;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((value, index) => ({
    name:
      chunks.length === 1
        ? "Enabled features"
        : `Enabled features ${index + 1}`,
    value,
    inline: false,
  }));
}

function buildFeatures(client, guild) {
  const features = [...new Set(guild.features.map(formatFeature))].sort(
    (a, b) => a.localeCompare(b),
  );

  return buildBaseEmbed(client, guild, {
    title: "Features",
    description: `${escapeMarkdown(guild.name)}\nThis server has ${formatNumber(
      features.length,
    )} feature${features.length === 1 ? "" : "s"} enabled.`,
  }).addFields(buildFeatureFields(features));
}

function buildPages(client, guild, info) {
  const pages = [
    {
      key: VIEW_OVERVIEW,
      label: "Overview",
      customId: OVERVIEW_ID,
      embed: buildOverview(client, guild, info),
    },
    {
      key: VIEW_SETTINGS,
      label: "Settings",
      customId: SETTINGS_ID,
      embed: buildSettings(client, guild),
    },
  ];

  if (guild.features?.length) {
    pages.push({
      key: VIEW_FEATURES,
      label: "Features",
      customId: FEATURES_ID,
      embed: buildFeatures(client, guild),
    });
  }

  return pages;
}

function buildButtons(pages, selectedKey, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      pages.map((page) =>
        new ButtonBuilder()
          .setCustomId(page.customId)
          .setLabel(page.label)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled || page.key === selectedKey),
      ),
    ),
  ];
}

function buildPayload(pages, selectedKey) {
  const page = pages.find((entry) => entry.key === selectedKey) || pages[0];

  return {
    embeds: [page.embed],
    components: buildButtons(pages, page.key),
    allowedMentions: { parse: [] },
  };
}

function attachViewer(message, pages) {
  let selected = pages[0].key;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    const page = pages.find((entry) => entry.customId === interaction.customId);

    if (!page) {
      return;
    }

    selected = page.key;

    await interaction
      .update({
        embeds: [page.embed],
        components: buildButtons(pages, selected),
      })
      .catch(() => null);
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({
        components: buildButtons(pages, selected, true),
      });
    } catch {
      // The message is gone, or the bot cannot edit it anymore.
    }
  });

  return collector;
}

function buildErrorEmbed(client, title, description) {
  return new EmbedBuilder()
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function serverOnlyEmbed(client) {
  return buildErrorEmbed(
    client,
    "Server only",
    "Run this command in a server to see its stats, settings, and features.",
  );
}

async function deliver(client, send, guild) {
  let pages;

  try {
    const info = await collectInfo(guild);
    pages = buildPages(client, guild, info);
  } catch (error) {
    signale.warn(`Serverinfo request failed: ${error.message}`);
    return send({
      embeds: [
        buildErrorEmbed(client, "Could not load this server", "Try again."),
      ],
    });
  }

  const sent = await send(buildPayload(pages, VIEW_OVERVIEW));

  if (sent?.createMessageComponentCollector) {
    attachViewer(sent, pages);
  }

  return sent;
}

module.exports = {
  name: "serverinfo",
  aliases: ["server", "guild", "guildinfo"],
  category: "info",
  description:
    "Show this server's member count, channels, settings, and features",
  run: async (client, message) => {
    if (!message.guild) {
      return message.reply({ embeds: [serverOnlyEmbed(client)] });
    }

    return deliver(client, (payload) => message.reply(payload), message.guild);
  },
  interaction: {
    data: {
      name: "serverinfo",
      type: 1,
      description:
        "Show this server's member count, channels, settings, and features",
    },
    run: async (client, interaction) => {
      if (!interaction.guild) {
        return interaction.reply({
          embeds: [serverOnlyEmbed(client)],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      return deliver(
        client,
        (payload) => interaction.editReply(payload),
        interaction.guild,
      );
    },
  },
};
