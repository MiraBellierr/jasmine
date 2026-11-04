const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  inlineCode,
} = require("discord.js");
const signale = require("signale");
const { getChannelFromArguments } = require("../../utils/getters");
const schemas = require("../../database/schemas");
const {
  applyDefaultPermission,
  channelOption,
  runPrefixCommand,
  slashCommand,
} = require("../../utils/slashCommands");

const BRAND_COLOR = "#CD1C6C";
const SUCCESS_COLOR = "#22C55E";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_QUERY = 50;

const VIEW_OVERVIEW = "overview";
const VIEW_EVENTS = "events";
const VIEW_CHANNELS = "channels";
const VIEW_USAGE = "usage";
const OVERVIEW_ID = "logging:view:overview";
const EVENTS_ID = "logging:view:events";
const CHANNELS_ID = "logging:view:channels";
const USAGE_ID = "logging:view:usage";

const VIEW_BY_ID = new Map([
  [OVERVIEW_ID, VIEW_OVERVIEW],
  [EVENTS_ID, VIEW_EVENTS],
  [CHANNELS_ID, VIEW_CHANNELS],
  [USAGE_ID, VIEW_USAGE],
]);

const EVENT_KEYS = [
  "channelCreation",
  "channelUpdate",
  "channelDeletion",
  "roleCreation",
  "roleUpdate",
  "roleDeletion",
  "serverUpdate",
  "emojiAndStickerChanges",
  "memberRoleChanges",
  "nameChanges",
  "avatarChanges",
  "memberBans",
  "memberUnbans",
  "joinVoice",
  "moveBetweenVoiceChannels",
  "leaveVoice",
  "messageDeletion",
  "messageEdit",
  "messagePurge",
  "discordInvites",
  "memberJoin",
  "memberLeave",
];

const CHANNEL_KEYS = [
  "defaultLogChannel",
  "memberLogChannel",
  "serverLogChannel",
  "voiceLogChannel",
  "joinLeaveLogChannel",
  "ignoredChannels",
];

const LOG_CHANNEL_KEYS = CHANNEL_KEYS.filter(
  (key) => key !== "ignoredChannels",
);

const EVENT_LABELS = {
  channelCreation: "Channel created",
  channelUpdate: "Channel updated",
  channelDeletion: "Channel deleted",
  roleCreation: "Role created",
  roleUpdate: "Role updated",
  roleDeletion: "Role deleted",
  serverUpdate: "Server updated",
  emojiAndStickerChanges: "Emoji or sticker changed",
  memberRoleChanges: "Member roles changed",
  nameChanges: "Member name changed",
  avatarChanges: "Avatar changed",
  memberBans: "Member banned",
  memberUnbans: "Member unbanned",
  joinVoice: "Joined voice",
  moveBetweenVoiceChannels: "Moved between voice channels",
  leaveVoice: "Left voice",
  messageDeletion: "Message deleted",
  messageEdit: "Message edited",
  messagePurge: "Messages purged",
  discordInvites: "Invite created or deleted",
  memberJoin: "Member joined",
  memberLeave: "Member left",
};

const CHANNEL_LABELS = {
  defaultLogChannel: "Default log channel",
  memberLogChannel: "Member log channel",
  serverLogChannel: "Server log channel",
  voiceLogChannel: "Voice log channel",
  joinLeaveLogChannel: "Join and leave log channel",
  ignoredChannels: "Ignored channels",
};

const EVENT_GROUPS = [
  {
    name: "Channels",
    events: ["channelCreation", "channelUpdate", "channelDeletion"],
  },
  {
    name: "Roles",
    events: ["roleCreation", "roleUpdate", "roleDeletion"],
  },
  {
    name: "Server",
    events: ["serverUpdate", "emojiAndStickerChanges"],
  },
  {
    name: "Members",
    events: [
      "memberJoin",
      "memberLeave",
      "memberRoleChanges",
      "nameChanges",
      "avatarChanges",
      "memberBans",
      "memberUnbans",
    ],
  },
  {
    name: "Messages",
    events: ["messageDeletion", "messageEdit", "messagePurge"],
  },
  {
    name: "Voice",
    events: ["joinVoice", "moveBetweenVoiceChannels", "leaveVoice"],
  },
  {
    name: "Invites",
    events: ["discordInvites"],
  },
];

const MODE_CHOICES = [
  { name: "Enable", value: "enable" },
  { name: "Disable", value: "disable" },
];

const EVENT_CHOICES = EVENT_KEYS.map((key) => ({
  name: EVENT_LABELS[key],
  value: key,
}));

const CHANNEL_CHOICES = CHANNEL_KEYS.map((key) => ({
  name: CHANNEL_LABELS[key],
  value: key,
}));

const DEFAULT_LOGGING = Object.fromEntries([
  ...EVENT_KEYS.map((key) => [key, false]),
  ...CHANNEL_KEYS.map((key) => [key, null]),
]);

const getPrefix = (client, guildId) =>
  (guildId && client.prefixes.get(guildId)) || process.env.PREFIX || "!";

const cleanQuery = (value) =>
  String(value ?? "")
    .replace(/[`\n\r]/g, " ")
    .trim()
    .slice(0, MAX_QUERY);

const findKey = (keys, input) => {
  const value = String(input ?? "").toLowerCase();

  return keys.find((key) => key.toLowerCase() === value) || null;
};

const parseMode = (value) => {
  const mode = String(value ?? "").toLowerCase();

  if (mode === "enable") {
    return true;
  }

  if (mode === "disable") {
    return false;
  }

  return null;
};

const channelValue = (id) => (id ? `<#${id}>` : "Not set");

const ignoredIds = (logging) =>
  String(logging.ignoredChannels || "")
    .split("|")
    .filter(Boolean);

const countEnabled = (logging) =>
  EVENT_KEYS.filter((key) => logging[key]).length;

function loadLogging(client, guildId) {
  const logging = { ...DEFAULT_LOGGING };
  const stored = client.loggings.get(guildId);

  if (!stored) {
    return logging;
  }

  for (const key of [...EVENT_KEYS, ...CHANNEL_KEYS]) {
    if (stored[key] !== undefined) {
      logging[key] = stored[key];
    }
  }

  return logging;
}

async function saveLogging(client, guildId, logging) {
  const payload = { ...logging, guildID: guildId };

  try {
    await schemas.logging().create(payload);
  } catch {
    await schemas
      .logging()
      .update({ ...logging }, { where: { guildID: guildId } });
  }

  client.loggings.set(guildId, payload);
}

function baseEmbed(client, guild, title) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Logging",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setTimestamp();
  const icon = guild?.iconURL?.({ size: 64 });

  embed.setFooter({
    text: guild?.name || "Server settings",
    ...(icon ? { iconURL: icon } : {}),
  });

  return embed;
}

function successEmbed(client, guild, title, description) {
  return baseEmbed(client, guild, title)
    .setColor(SUCCESS_COLOR)
    .setDescription(description);
}

function errorEmbed(client, guild, title, description) {
  return baseEmbed(client, guild, title)
    .setColor(ERROR_COLOR)
    .setDescription(description);
}

function serverOnlyEmbed(client) {
  return errorEmbed(
    client,
    null,
    "Server only",
    "Run this command in a server to change logging.",
  );
}

function overviewDescription(logging) {
  if (!logging.defaultLogChannel) {
    return "No default log channel is set. Nothing is logged until you set one.";
  }

  if (!countEnabled(logging)) {
    return "No events are on. Use the event command to turn one on.";
  }

  return "Events go to the default channel unless a channel is set for them.";
}

function eventGroupValue(events, logging) {
  const on = events
    .filter((key) => logging[key])
    .map((key) => EVENT_LABELS[key]);
  const off = events
    .filter((key) => !logging[key])
    .map((key) => EVENT_LABELS[key]);

  return [
    `On: ${on.join(", ") || "None"}`,
    `Off: ${off.join(", ") || "None"}`,
  ].join("\n");
}

function formatIgnored(logging) {
  const ids = ignoredIds(logging);

  if (!ids.length) {
    return "None";
  }

  const shown = [];
  let length = 0;

  for (const id of ids) {
    const mention = `<#${id}>`;

    if (length && length + mention.length + 1 > 1000) {
      const remaining = ids.length - shown.length;
      return `${shown.join("\n")}\nand ${remaining} more`;
    }

    shown.push(mention);
    length += mention.length + 1;
  }

  return shown.join("\n");
}

function buildOverview(client, guild, logging) {
  return baseEmbed(client, guild, "Logging settings")
    .setDescription(overviewDescription(logging))
    .addFields(
      {
        name: "Events on",
        value: `${countEnabled(logging)} of ${EVENT_KEYS.length}`,
        inline: true,
      },
      {
        name: "Log channels",
        value: `${LOG_CHANNEL_KEYS.filter((key) => logging[key]).length} of ${
          LOG_CHANNEL_KEYS.length
        }`,
        inline: true,
      },
      {
        name: "Ignored channels",
        value: String(ignoredIds(logging).length),
        inline: true,
      },
      {
        name: "Default log channel",
        value: channelValue(logging.defaultLogChannel),
        inline: false,
      },
    );
}

function buildEvents(client, guild, logging) {
  const enabled = countEnabled(logging);
  const embed = baseEmbed(client, guild, "Events").setDescription(
    `${enabled} of ${EVENT_KEYS.length} ${
      enabled === 1 ? "event is" : "events are"
    } on.`,
  );

  for (const group of EVENT_GROUPS) {
    embed.addFields({
      name: group.name,
      value: eventGroupValue(group.events, logging),
      inline: false,
    });
  }

  return embed;
}

function buildChannels(client, guild, logging) {
  const embed = baseEmbed(client, guild, "Log channels").setDescription(
    "A default log channel is required. The other channels are used for their events when set. Ignored channels are skipped by channel and message events.",
  );

  for (const key of LOG_CHANNEL_KEYS) {
    embed.addFields({
      name: CHANNEL_LABELS[key],
      value: channelValue(logging[key]),
      inline: true,
    });
  }

  return embed.addFields({
    name: CHANNEL_LABELS.ignoredChannels,
    value: formatIgnored(logging),
    inline: false,
  });
}

function buildUsage(client, guild, prefix) {
  return baseEmbed(client, guild, "Usage")
    .setDescription("Names are case-insensitive.")
    .addFields(
      {
        name: "Prefix",
        value: [
          `\`${prefix}logging\``,
          `\`${prefix}logging view\``,
          `\`${prefix}logging <event> <enable|disable>\``,
          `\`${prefix}logging all <enable|disable>\``,
          `\`${prefix}logging <channel option> <channel> [--remove]\``,
        ].join("\n"),
      },
      {
        name: "Slash",
        value: [
          "`/logging view`",
          "`/logging event`",
          "`/logging all`",
          "`/logging channel`",
        ].join("\n"),
      },
      {
        name: "Event names",
        value: EVENT_KEYS.map((key) => `\`${key}\``).join(", "),
      },
      {
        name: "Channel options",
        value: CHANNEL_KEYS.map((key) => `\`${key}\``).join(", "),
      },
      {
        name: "Examples",
        value: [
          `\`${prefix}logging messageDeletion enable\``,
          `\`${prefix}logging defaultLogChannel #mod-logs\``,
          `\`${prefix}logging ignoredChannels #general --remove\``,
        ].join("\n"),
      },
    );
}

function buildPages(client, guild, logging, prefix) {
  return [
    {
      key: VIEW_OVERVIEW,
      label: "Overview",
      customId: OVERVIEW_ID,
      embed: buildOverview(client, guild, logging),
    },
    {
      key: VIEW_EVENTS,
      label: "Events",
      customId: EVENTS_ID,
      embed: buildEvents(client, guild, logging),
    },
    {
      key: VIEW_CHANNELS,
      label: "Channels",
      customId: CHANNELS_ID,
      embed: buildChannels(client, guild, logging),
    },
    {
      key: VIEW_USAGE,
      label: "Usage",
      customId: USAGE_ID,
      embed: buildUsage(client, guild, prefix),
    },
  ];
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
  };
}

function attachViewer(message, pages) {
  let selected = pages[0].key;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    const view = VIEW_BY_ID.get(interaction.customId);

    if (!view) {
      return;
    }

    selected = view;

    await interaction.update(buildPayload(pages, view)).catch(() => null);
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

async function showViews(client, message, logging) {
  const prefix = getPrefix(client, message.guild.id);
  const pages = buildPages(client, message.guild, logging, prefix);
  const sent = await message.channel.send(buildPayload(pages, VIEW_OVERVIEW));

  if (sent?.createMessageComponentCollector) {
    attachViewer(sent, pages);
  }

  return sent;
}

async function commit(client, message, logging, embed) {
  try {
    await saveLogging(client, message.guild.id, logging);
  } catch (error) {
    signale.error(`Logging update failed: ${error.message}`);

    return message.channel.send({
      embeds: [
        errorEmbed(
          client,
          message.guild,
          "Could not save settings",
          "The change was not saved. Try again.",
        ),
      ],
    });
  }

  return message.channel.send({ embeds: [embed] });
}

function modeErrorEmbed(client, guild, mode, missingDescription) {
  if (mode === undefined) {
    return errorEmbed(client, guild, "Missing mode", missingDescription);
  }

  return errorEmbed(
    client,
    guild,
    "Invalid mode",
    "Use `enable` or `disable`.",
  );
}

async function handleAll(client, message, logging, args) {
  const mode = parseMode(args[1]);

  if (mode === null) {
    return message.channel.send({
      embeds: [
        modeErrorEmbed(
          client,
          message.guild,
          args[1],
          "Add `enable` or `disable` after `all`.",
        ),
      ],
    });
  }

  for (const key of EVENT_KEYS) {
    logging[key] = mode;
  }

  return commit(
    client,
    message,
    logging,
    successEmbed(
      client,
      message.guild,
      "Events updated",
      `All ${EVENT_KEYS.length} events are now ${mode ? "on" : "off"}.`,
    ),
  );
}

async function handleEvent(client, message, logging, args, eventKey) {
  const mode = parseMode(args[1]);
  const label = EVENT_LABELS[eventKey];

  if (mode === null) {
    return message.channel.send({
      embeds: [
        modeErrorEmbed(
          client,
          message.guild,
          args[1],
          "Add `enable` or `disable` after the event name.",
        ),
      ],
    });
  }

  logging[eventKey] = mode;

  return commit(
    client,
    message,
    logging,
    successEmbed(
      client,
      message.guild,
      "Event updated",
      `${label} is now ${mode ? "on" : "off"}.`,
    ),
  );
}

async function handleChannel(client, message, logging, args, channelKey) {
  const label = CHANNEL_LABELS[channelKey];
  const remove = args
    .slice(1)
    .some((arg) => String(arg).toLowerCase() === "--remove");
  const rawChannel =
    args[1] && String(args[1]).toLowerCase() !== "--remove" ? args[1] : null;

  if (channelKey === "ignoredChannels") {
    if (!rawChannel) {
      return message.channel.send({
        embeds: [
          errorEmbed(
            client,
            message.guild,
            "Missing channel",
            "Enter the channel to ignore or stop ignoring.",
          ),
        ],
      });
    }

    const channel = await getChannelFromArguments(message, rawChannel);

    if (!channel) {
      return message.channel.send({
        embeds: [
          errorEmbed(
            client,
            message.guild,
            "Channel not found",
            `No channel matches ${inlineCode(cleanQuery(rawChannel))}.`,
          ),
        ],
      });
    }

    const ids = ignoredIds(logging);

    if (remove) {
      if (!ids.length) {
        return message.channel.send({
          embeds: [
            errorEmbed(
              client,
              message.guild,
              "No ignored channels",
              "The ignored channel list is empty.",
            ),
          ],
        });
      }

      if (!ids.includes(channel.id)) {
        return message.channel.send({
          embeds: [
            errorEmbed(
              client,
              message.guild,
              "Channel not ignored",
              `${channel} is not in the ignored channel list.`,
            ),
          ],
        });
      }

      const remaining = ids.filter((id) => id !== channel.id);
      logging.ignoredChannels = remaining.length ? remaining.join("|") : null;

      return commit(
        client,
        message,
        logging,
        successEmbed(
          client,
          message.guild,
          "Channel updated",
          `${channel} is no longer ignored.`,
        ),
      );
    }

    if (ids.includes(channel.id)) {
      return message.channel.send({
        embeds: [
          errorEmbed(
            client,
            message.guild,
            "Channel already ignored",
            `${channel} is already ignored.`,
          ),
        ],
      });
    }

    ids.push(channel.id);
    logging.ignoredChannels = ids.join("|");

    return commit(
      client,
      message,
      logging,
      successEmbed(
        client,
        message.guild,
        "Channel updated",
        `${channel} is now ignored by channel and message events.`,
      ),
    );
  }

  if (remove) {
    logging[channelKey] = null;

    return commit(
      client,
      message,
      logging,
      successEmbed(
        client,
        message.guild,
        "Channel updated",
        `${label} is no longer set.`,
      ),
    );
  }

  if (!rawChannel) {
    return message.channel.send({
      embeds: [
        errorEmbed(
          client,
          message.guild,
          "Missing channel",
          "Enter a channel name, mention, or ID.",
        ),
      ],
    });
  }

  const channel = await getChannelFromArguments(message, rawChannel);

  if (!channel) {
    return message.channel.send({
      embeds: [
        errorEmbed(
          client,
          message.guild,
          "Channel not found",
          `No channel matches ${inlineCode(cleanQuery(rawChannel))}.`,
        ),
      ],
    });
  }

  if (typeof channel.isTextBased === "function" && !channel.isTextBased()) {
    return message.channel.send({
      embeds: [
        errorEmbed(
          client,
          message.guild,
          "Not a text channel",
          "Pick a text channel so I can send logs there.",
        ),
      ],
    });
  }

  logging[channelKey] = channel.id;

  return commit(
    client,
    message,
    logging,
    successEmbed(
      client,
      message.guild,
      "Channel updated",
      `${label} is now ${channel}.`,
    ),
  );
}

function unknownOptionEmbed(client, guild, input, prefix) {
  return errorEmbed(
    client,
    guild,
    "Unknown option",
    `No event or channel option matches ${inlineCode(
      cleanQuery(input),
    )}. Open the Usage view with \`${prefix}logging\`.`,
  );
}

module.exports = {
  name: "logging",
  aliases: ["logs"],
  category: "moderation",
  description: "Choose which server events are logged and where they go",
  clientPermission: "ManageGuild",
  memberPermission: "ManageMessages",
  usage:
    "[view] | <event> <enable|disable> | <channel option> <channel> [--remove] | all <enable|disable>",
  run: async (client, message, args) => {
    if (!message.guild) {
      return message.channel.send({ embeds: [serverOnlyEmbed(client)] });
    }

    const logging = loadLogging(client, message.guild.id);
    const input = args[0];

    if (!input || input.toLowerCase() === "view") {
      return showViews(client, message, logging);
    }

    if (input.toLowerCase() === "all") {
      return handleAll(client, message, logging, args);
    }

    const eventKey = findKey(EVENT_KEYS, input);

    if (eventKey) {
      return handleEvent(client, message, logging, args, eventKey);
    }

    const channelKey = findKey(CHANNEL_KEYS, input);

    if (channelKey) {
      return handleChannel(client, message, logging, args, channelKey);
    }

    return message.channel.send({
      embeds: [
        unknownOptionEmbed(
          client,
          message.guild,
          input,
          getPrefix(client, message.guild.id),
        ),
      ],
    });
  },
  interaction: {
    data: applyDefaultPermission(
      slashCommand(
        "logging",
        "Choose which server events are logged and where they go",
        (builder) =>
          builder
            .addSubcommand((subcommand) =>
              subcommand
                .setName("view")
                .setDescription("Show the current logging settings"),
            )
            .addSubcommand((subcommand) =>
              subcommand
                .setName("all")
                .setDescription("Turn every event on or off")
                .addStringOption((option) =>
                  option
                    .setName("mode")
                    .setDescription("Whether to turn events on or off")
                    .setRequired(true)
                    .addChoices(...MODE_CHOICES),
                ),
            )
            .addSubcommand((subcommand) =>
              subcommand
                .setName("event")
                .setDescription("Turn one event on or off")
                .addStringOption((option) =>
                  option
                    .setName("event")
                    .setDescription("Event to update")
                    .setRequired(true)
                    .addChoices(...EVENT_CHOICES),
                )
                .addStringOption((option) =>
                  option
                    .setName("mode")
                    .setDescription("Whether to turn this event on or off")
                    .setRequired(true)
                    .addChoices(...MODE_CHOICES),
                ),
            )
            .addSubcommand((subcommand) =>
              subcommand
                .setName("channel")
                .setDescription("Set or remove a logging channel")
                .addStringOption((option) =>
                  option
                    .setName("option")
                    .setDescription("Channel setting to update")
                    .setRequired(true)
                    .addChoices(...CHANNEL_CHOICES),
                )
                .addChannelOption((option) =>
                  channelOption(
                    option,
                    "channel",
                    "Channel to use for logging",
                  ),
                )
                .addBooleanOption((option) =>
                  option
                    .setName("remove")
                    .setDescription("Remove the channel instead of setting it")
                    .setRequired(false),
                ),
            ),
      ),
      "ManageMessages",
    ),
    run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "view") {
        return runPrefixCommand(client, interaction, module.exports);
      }

      if (subcommand === "all") {
        return runPrefixCommand(client, interaction, module.exports, [
          "all",
          interaction.options.getString("mode", true),
        ]);
      }

      if (subcommand === "event") {
        return runPrefixCommand(client, interaction, module.exports, [
          interaction.options.getString("event", true),
          interaction.options.getString("mode", true),
        ]);
      }

      const args = [
        interaction.options.getString("option", true),
        interaction.options.getChannel("channel", true).id,
      ];

      if (interaction.options.getBoolean("remove")) {
        args.push("--remove");
      }

      return runPrefixCommand(client, interaction, module.exports, args);
    },
  },
};
