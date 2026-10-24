const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  escapeMarkdown,
  inlineCode,
} = require("discord.js");
const { getRoleFromArguments } = require("../../utils/getters");
const signale = require("signale");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_QUERY = 50;
const MAX_FIELD_LENGTH = 1000;

const VIEW_OVERVIEW = "overview";
const VIEW_PERMISSIONS = "permissions";
const OVERVIEW_ID = "roleinfo:view:overview";
const PERMISSIONS_ID = "roleinfo:view:permissions";

const VIEW_BY_ID = new Map([
  [OVERVIEW_ID, VIEW_OVERVIEW],
  [PERMISSIONS_ID, VIEW_PERMISSIONS],
]);

const truncate = (value, max) =>
  String(value ?? "").length > max
    ? `${String(value).slice(0, max - 3)}...`
    : String(value ?? "");

const cleanQuery = (value) =>
  truncate(String(value ?? "").replace(/`/g, "'"), MAX_QUERY);

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

const yesNo = (value) => (value ? "Yes" : "No");

function formatTimestamp(value) {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? `<t:${Math.floor(time / 1000)}:f>` : "Unknown";
}

function formatPermission(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase())
    .replace(/ And /g, " and ");
}

function roleType(role) {
  if (role.tags?.botId) {
    return "Bot role";
  }

  if (role.tags?.integrationId) {
    return "Integration role";
  }

  if (role.tags?.premiumSubscriberRole) {
    return "Booster role";
  }

  if (role.tags?.subscriptionListId) {
    return "Subscription role";
  }

  if (role.managed) {
    return "Managed role";
  }

  return "Custom role";
}

async function countMembers(role) {
  const guild = role.guild;

  if (guild.members.cache.size < guild.memberCount) {
    await guild.members.fetch().catch(() => null);
  }

  return guild.members.cache.filter((member) => member.roles.cache.has(role.id))
    .size;
}

function buildPermissionFields(permissions) {
  const lines = permissions
    .map(formatPermission)
    .sort((a, b) => a.localeCompare(b))
    .map((permission) => `• ${permission}`);
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
    name: chunks.length === 1 ? "Permissions" : `Permissions ${index + 1}`,
    value,
    inline: false,
  }));
}

function baseEmbed(client, role) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Role information",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(role.color ? role.hexColor : BRAND_COLOR)
    .setFooter({
      text: `Role ID ${role.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  const thumbnail =
    role.iconURL({ size: 256 }) || role.guild.iconURL({ size: 256 });

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return embed;
}

function buildOverview(client, role, memberCount) {
  const permissionCount = role.permissions.toArray().length;
  const permissionSummary = role.permissions.has(
    PermissionsBitField.Flags.Administrator,
  )
    ? "Administrator"
    : permissionCount
      ? formatNumber(permissionCount)
      : "None";

  return baseEmbed(client, role)
    .setTitle(escapeMarkdown(role.name))
    .addFields(
      { name: "Members", value: formatNumber(memberCount), inline: true },
      { name: "Position", value: formatNumber(role.position), inline: true },
      {
        name: "Color",
        value: role.color ? role.hexColor.toUpperCase() : "Default",
        inline: true,
      },
      {
        name: "Created",
        value: formatTimestamp(role.createdTimestamp),
        inline: true,
      },
      {
        name: "Can be mentioned",
        value: yesNo(role.mentionable),
        inline: true,
      },
      {
        name: "Separate in member list",
        value: yesNo(role.hoist),
        inline: true,
      },
      { name: "Managed by an app", value: yesNo(role.managed), inline: true },
      { name: "Type", value: roleType(role), inline: true },
      { name: "Permissions", value: permissionSummary, inline: true },
    );
}

function buildPermissions(client, role) {
  const embed = baseEmbed(client, role).setTitle("Permissions");

  if (role.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return embed.setDescription(`${role}\nThis role has every permission.`);
  }

  const permissions = role.permissions.toArray();

  if (!permissions.length) {
    return embed.setDescription(`${role}\nThis role has no permissions.`);
  }

  embed.setDescription(
    `${role}\nThis role has ${formatNumber(permissions.length)} permission${
      permissions.length === 1 ? "" : "s"
    }.`,
  );

  return embed.addFields(buildPermissionFields(permissions));
}

function buildPages(client, role, memberCount) {
  return [
    {
      key: VIEW_OVERVIEW,
      label: "Overview",
      customId: OVERVIEW_ID,
      embed: buildOverview(client, role, memberCount),
    },
    {
      key: VIEW_PERMISSIONS,
      label: "Permissions",
      customId: PERMISSIONS_ID,
      embed: buildPermissions(client, role),
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

function buildErrorEmbed(client, title, description) {
  return new EmbedBuilder()
    .setAuthor({
      name: escapeMarkdown(client.user.username),
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
    "Run this command in a server to look up a role.",
  );
}

function roleNotFoundEmbed(client, input) {
  return buildErrorEmbed(
    client,
    "Role not found",
    `No role matches ${inlineCode(
      cleanQuery(input),
    )}. Mention a role or enter its name or ID.`,
  );
}

async function deliver(client, send, role) {
  let pages;

  try {
    const memberCount = await countMembers(role);
    pages = buildPages(client, role, memberCount);
  } catch (error) {
    signale.warn(`Roleinfo request failed: ${error.message}`);
    return send({
      embeds: [
        buildErrorEmbed(client, "Could not load this role", "Try again."),
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
  name: "roleinfo",
  aliases: ["role"],
  category: "info",
  description: "Show a role's members, settings, and permissions",
  usage: "[role]",
  run: async (client, message, args) => {
    if (!message.guild) {
      return message.reply({ embeds: [serverOnlyEmbed(client)] });
    }

    const input = args.join(" ").trim();
    let role;

    if (input) {
      role = await getRoleFromArguments(message, input);

      if (!role) {
        return message.reply({ embeds: [roleNotFoundEmbed(client, input)] });
      }
    } else {
      role = message.member?.roles?.highest || message.guild.roles.everyone;
    }

    return deliver(client, (payload) => message.reply(payload), role);
  },
  interaction: {
    data: {
      name: "roleinfo",
      type: 1,
      description: "Show a role's members, settings, and permissions",
      options: [
        {
          name: "role",
          type: 8,
          description: "Role to show. Defaults to your highest role.",
          required: false,
        },
      ],
    },
    run: async (client, interaction) => {
      if (!interaction.guild) {
        return interaction.reply({
          embeds: [serverOnlyEmbed(client)],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      const role =
        interaction.options.getRole("role") ||
        interaction.member?.roles?.highest ||
        interaction.guild.roles.everyone;

      return deliver(client, (payload) => interaction.editReply(payload), role);
    },
  },
};
