const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const signale = require("signale");

const ERROR_COLOR = "#EF4444";
const READY_COLOR = "#22C55E";
const PARTIAL_COLOR = "#F59E0B";
const VIEW_TIMEOUT = 180_000;
const SHARDS_PER_PAGE = 20;

const VIEW_OVERVIEW = "overview";
const VIEW_SHARDS = "shards";

const OVERVIEW_ID = "shardstatus:view:overview";
const SHARDS_ID = "shardstatus:view:shards";
const PREVIOUS_ID = "shardstatus:page:previous";
const NEXT_ID = "shardstatus:page:next";

const STATUS_READY = 0;
const INACTIVE_STATUS = new Set([3, 5]);

const SHARD_STATUS = {
  0: "Ready",
  1: "Connecting",
  2: "Reconnecting",
  3: "Idle",
  4: "Almost ready",
  5: "Disconnected",
  6: "Loading servers",
  7: "Signing in",
  8: "Resuming",
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

function formatPing(value) {
  return Number.isFinite(value) && value >= 0
    ? `${Math.round(value)} ms`
    : "Unknown";
}

function formatStatus(value) {
  return SHARD_STATUS[value] ?? "Unknown";
}

async function collectShards(client) {
  if (!client.shard) {
    return [
      {
        id: 0,
        status: client.ws.status,
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
      },
    ];
  }

  const results = await client.shard.broadcastEval((shardClient) => ({
    id: shardClient.shard.ids[0],
    status: shardClient.ws.status,
    ping: shardClient.ws.ping,
    guilds: shardClient.guilds.cache.size,
  }));

  return results.sort((a, b) => a.id - b.id);
}

function healthColor(shards) {
  if (shards.length && shards.every((shard) => shard.status === STATUS_READY)) {
    return READY_COLOR;
  }

  if (shards.some((shard) => !INACTIVE_STATUS.has(shard.status))) {
    return PARTIAL_COLOR;
  }

  return ERROR_COLOR;
}

function buildBaseEmbed(client, title, shards) {
  return new EmbedBuilder()
    .setAuthor({
      name: "Shard status",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(healthColor(shards))
    .setTitle(title)
    .setFooter({
      text: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();
}

function buildOverview(client, shards, currentShardId) {
  const ready = shards.filter((shard) => shard.status === STATUS_READY).length;
  const guilds = shards.reduce((total, shard) => total + shard.guilds, 0);
  const pings = shards
    .map((shard) => shard.ping)
    .filter((ping) => Number.isFinite(ping) && ping >= 0);
  const averagePing = pings.length
    ? formatPing(pings.reduce((total, ping) => total + ping, 0) / pings.length)
    : "Unknown";

  return buildBaseEmbed(client, "Shard overview", shards).addFields(
    { name: "Shards", value: formatNumber(shards.length), inline: true },
    { name: "Ready shards", value: formatNumber(ready), inline: true },
    { name: "Servers", value: formatNumber(guilds), inline: true },
    { name: "Average ping", value: averagePing, inline: true },
    {
      name: "Current shard",
      value:
        currentShardId === null ? "Direct message" : `Shard ${currentShardId}`,
      inline: true,
    },
  );
}

function buildShards(client, shards, page, currentShardId) {
  const embed = buildBaseEmbed(client, "Shards", shards);
  const start = page * SHARDS_PER_PAGE;
  const visible = shards.slice(start, start + SHARDS_PER_PAGE);

  if (!visible.length) {
    return embed.setDescription("No shards reported.");
  }

  if (shards.length > SHARDS_PER_PAGE) {
    embed.setDescription(
      `Showing ${formatNumber(start + 1)} to ${formatNumber(
        start + visible.length,
      )} of ${formatNumber(shards.length)}.`,
    );
  }

  return embed.addFields(
    ...visible.map((shard) => ({
      name:
        shard.id === currentShardId
          ? `Shard ${shard.id} (this server)`
          : `Shard ${shard.id}`,
      value: `Status: ${formatStatus(shard.status)}\nPing: ${formatPing(
        shard.ping,
      )}\nServers: ${formatNumber(shard.guilds)}`,
      inline: false,
    })),
  );
}

function pageCountFor(shards) {
  return Math.max(1, Math.ceil(shards.length / SHARDS_PER_PAGE));
}

function buildButtons(state, pageCount, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(OVERVIEW_ID)
      .setLabel("Overview")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || state.view === VIEW_OVERVIEW),
    new ButtonBuilder()
      .setCustomId(SHARDS_ID)
      .setLabel("Shards")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || state.view === VIEW_SHARDS),
  );

  if (state.view === VIEW_SHARDS && pageCount > 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(PREVIOUS_ID)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || state.page === 0),
      new ButtonBuilder()
        .setCustomId(NEXT_ID)
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || state.page >= pageCount - 1),
    );
  }

  return [row];
}

function buildPayload(client, shards, state, currentShardId) {
  const pageCount = pageCountFor(shards);
  const page = Math.min(state.page, pageCount - 1);
  const embed =
    state.view === VIEW_SHARDS
      ? buildShards(client, shards, page, currentShardId)
      : buildOverview(client, shards, currentShardId);

  return {
    embeds: [embed],
    components: buildButtons(state, pageCount),
  };
}

function attachViewer(message, client, shards, state, currentShardId) {
  const pageCount = pageCountFor(shards);

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === OVERVIEW_ID) {
      state.view = VIEW_OVERVIEW;
    } else if (interaction.customId === SHARDS_ID) {
      state.view = VIEW_SHARDS;
      state.page = 0;
    } else if (interaction.customId === PREVIOUS_ID) {
      state.page = Math.max(0, state.page - 1);
    } else if (interaction.customId === NEXT_ID) {
      state.page = Math.min(pageCount - 1, state.page + 1);
    } else {
      return;
    }

    await interaction
      .update(buildPayload(client, shards, state, currentShardId))
      .catch(() => null);
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({
        components: buildButtons(state, pageCount, true),
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
      name: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle("Could not load shard status")
    .setDescription("Try again.")
    .setTimestamp();
}

async function deliver(client, send, guild) {
  let shards;

  try {
    shards = await collectShards(client);
  } catch (error) {
    signale.warn(`Shard status request failed: ${error.message}`);
    return send({ embeds: [buildErrorEmbed(client)] });
  }

  const currentShardId = guild ? guild.shardId : null;
  const state = { view: VIEW_OVERVIEW, page: 0 };
  const sent = await send(buildPayload(client, shards, state, currentShardId));

  if (sent?.createMessageComponentCollector) {
    attachViewer(sent, client, shards, state, currentShardId);
  }

  return sent;
}

module.exports = {
  name: "shardstatus",
  aliases: ["shard"],
  category: "info",
  description: "Show each shard's status, ping, and server count",
  run: async (client, message) => {
    return deliver(client, (payload) => message.reply(payload), message.guild);
  },
  interaction: {
    data: {
      name: "shardstatus",
      type: 1,
      description: "Show each shard's status, ping, and server count",
    },
    run: async (client, interaction) => {
      await interaction.deferReply();

      return deliver(
        client,
        (payload) => interaction.editReply(payload),
        interaction.guild,
      );
    },
  },
};
