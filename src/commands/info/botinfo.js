const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  escapeMarkdown,
  version: discordVersion,
} = require("discord.js");
const sqlite = require("better-sqlite3/package.json");
const signale = require("signale");
const jasmine = require("../../../package.json");
const { supportServer } = require("../../utils/constants");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 300_000;

const VIEW_OVERVIEW = "overview";
const VIEW_SYSTEM = "system";
const OVERVIEW_ID = "botinfo:view:overview";
const SYSTEM_ID = "botinfo:view:system";

const VIEW_BY_ID = new Map([
  [OVERVIEW_ID, VIEW_OVERVIEW],
  [SYSTEM_ID, VIEW_SYSTEM],
]);

const PLATFORM_NAMES = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

function formatUptime(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "Unknown";
  }

  const totalMinutes = Math.floor(milliseconds / 60_000);

  if (totalMinutes < 1) {
    return "Less than a minute";
  }

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (!days && minutes) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  return parts.join(", ");
}

function formatMemory(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown";
  }

  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 100 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

function formatPing(ping) {
  return Number.isFinite(ping) && ping >= 0
    ? `${Math.round(ping)} ms`
    : "Unavailable";
}

function formatTimestamp(value) {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? `<t:${Math.floor(time / 1000)}:f>` : "Unknown";
}

function formatPlatform() {
  const name = PLATFORM_NAMES[process.platform] ?? process.platform;
  return `${name} ${process.arch}`;
}

async function resolveOwner(client) {
  try {
    const application = client.application;

    if (!application) {
      return "Unknown";
    }

    const resolved = application.owner
      ? application
      : await application.fetch();
    const owner = resolved?.owner;

    if (!owner) {
      return "Unknown";
    }

    return owner.username || owner.name || "Unknown";
  } catch {
    return "Unknown";
  }
}

function countMembers(guilds) {
  if (!guilds) {
    return 0;
  }

  let members = 0;

  for (const guild of guilds.values()) {
    members += guild?.memberCount ?? 0;
  }

  return members;
}

function localTotals(client) {
  return {
    servers: client.guilds?.cache?.size ?? 0,
    members: countMembers(client.guilds?.cache),
    channels: client.channels?.cache?.size ?? 0,
    emojis: client.emojis?.cache?.size ?? 0,
  };
}

function addTotals(totals, shard) {
  return {
    servers: totals.servers + (shard.servers ?? 0),
    members: totals.members + (shard.members ?? 0),
    channels: totals.channels + (shard.channels ?? 0),
    emojis: totals.emojis + (shard.emojis ?? 0),
  };
}

async function collectTotals(client) {
  if (!client.shard) {
    return localTotals(client);
  }

  const results = await client.shard.broadcastEval((shardClient) => {
    let members = 0;

    for (const guild of shardClient.guilds.cache.values()) {
      members += guild.memberCount ?? 0;
    }

    return {
      servers: shardClient.guilds.cache.size,
      members,
      channels: shardClient.channels.cache.size,
      emojis: shardClient.emojis.cache.size,
    };
  });

  return results.reduce(addTotals, {
    servers: 0,
    members: 0,
    channels: 0,
    emojis: 0,
  });
}

async function collectInfo(client) {
  const totals = await collectTotals(client);
  const memory = process.memoryUsage();

  return {
    owner: await resolveOwner(client),
    version: jasmine.version,
    uptime: formatUptime(client.uptime),
    servers: totals.servers,
    members: totals.members,
    commands: client.commands?.size ?? 0,
    shards: client.shard?.count ?? 1,
    created: formatTimestamp(client.user?.createdTimestamp),
    ready: formatTimestamp(client.readyAt),
    node: process.version,
    discord: discordVersion,
    sqlite: sqlite.version,
    platform: formatPlatform(),
    memory: formatMemory(memory.rss),
    heap: formatMemory(memory.heapUsed),
    ping: formatPing(client.ws?.ping),
    channels: totals.channels,
    emojis: totals.emojis,
  };
}

function baseEmbed(client, title) {
  return new EmbedBuilder()
    .setAuthor({
      name: "Bot information",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTitle(title)
    .setColor(BRAND_COLOR)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Bot ID ${client.user.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();
}

function buildOverview(client, info) {
  return baseEmbed(client, escapeMarkdown(client.user.username)).addFields(
    { name: "Developer", value: escapeMarkdown(info.owner), inline: true },
    { name: "Version", value: `v${info.version}`, inline: true },
    { name: "Uptime", value: info.uptime, inline: true },
    { name: "Servers", value: formatNumber(info.servers), inline: true },
    { name: "Members", value: formatNumber(info.members), inline: true },
    { name: "Commands", value: formatNumber(info.commands), inline: true },
    { name: "Account created", value: info.created, inline: true },
    { name: "Online since", value: info.ready, inline: true },
    { name: "Shards", value: formatNumber(info.shards), inline: true },
  );
}

function buildSystem(client, info) {
  return baseEmbed(client, "System").addFields(
    { name: "Node.js", value: info.node, inline: true },
    { name: "discord.js", value: `v${info.discord}`, inline: true },
    {
      name: "Database",
      value: `better-sqlite3 v${info.sqlite}`,
      inline: true,
    },
    { name: "Platform", value: info.platform, inline: true },
    { name: "Process memory", value: info.memory, inline: true },
    { name: "Heap used", value: info.heap, inline: true },
    { name: "Ping", value: info.ping, inline: true },
    { name: "Channels", value: formatNumber(info.channels), inline: true },
    { name: "Emojis", value: formatNumber(info.emojis), inline: true },
  );
}

function buildEmbed(client, info, view) {
  return view === VIEW_SYSTEM
    ? buildSystem(client, info)
    : buildOverview(client, info);
}

function buildButtons(client, selected, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(OVERVIEW_ID)
        .setLabel("Overview")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || selected === VIEW_OVERVIEW),
      new ButtonBuilder()
        .setCustomId(SYSTEM_ID)
        .setLabel("System")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || selected === VIEW_SYSTEM),
      new ButtonBuilder()
        .setLabel("GitHub")
        .setStyle(ButtonStyle.Link)
        .setURL(jasmine.homepage),
      new ButtonBuilder()
        .setLabel("Invite")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=0&scope=bot%20applications.commands`,
        ),
      new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL(supportServer.url),
    ),
  ];
}

function buildPayload(client, info, selected) {
  return {
    embeds: [buildEmbed(client, info, selected)],
    components: buildButtons(client, selected),
  };
}

function attachViewer(client, message, info) {
  let selected = VIEW_OVERVIEW;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    const view = VIEW_BY_ID.get(interaction.customId);

    if (!view) {
      return;
    }

    selected = view;

    await interaction
      .update({
        embeds: [buildEmbed(client, info, view)],
        components: buildButtons(client, view),
      })
      .catch(() => null);
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({
        components: buildButtons(client, selected, true),
      });
    } catch {
      // The message is gone, or the bot cannot edit it anymore.
    }
  });

  return collector;
}

function buildErrorEmbed(client) {
  return new EmbedBuilder()
    .setAuthor({
      name: escapeMarkdown(client.user.username),
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle("Could not load bot information")
    .setDescription("Try again in a moment.")
    .setTimestamp();
}

async function deliver(client, send) {
  let info;

  try {
    info = await collectInfo(client);
  } catch (error) {
    signale.warn(`Botinfo request failed: ${error.message}`);
    return send({ embeds: [buildErrorEmbed(client)] });
  }

  const sent = await send(buildPayload(client, info, VIEW_OVERVIEW));

  if (sent?.createMessageComponentCollector) {
    attachViewer(client, sent, info);
  }

  return sent;
}

module.exports = {
  name: "botinfo",
  aliases: ["bot"],
  category: "info",
  description: "Show bot statistics, software versions, memory, and ping",
  run: async (client, message) => {
    return deliver(client, (payload) => message.reply(payload));
  },
  interaction: {
    data: {
      name: "botinfo",
      type: 1,
      description: "Show bot statistics, software versions, memory, and ping",
    },
    run: async (client, interaction) => {
      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload));
    },
  },
};
