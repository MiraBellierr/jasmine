const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  escapeMarkdown,
  inlineCode,
} = require("discord.js");
const { getUserFromArguments } = require("../../utils/getters");
const signale = require("signale");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_QUERY = 50;
const MAX_FIELD_LENGTH = 1000;

const VIEW_USER = "user";
const VIEW_MEMBER = "member";
const VIEW_ROLES = "roles";

const USER_ID = "whois:view:user";
const MEMBER_ID = "whois:view:member";
const ROLES_ID = "whois:view:roles";

const VIEW_BY_ID = new Map([
  [USER_ID, VIEW_USER],
  [MEMBER_ID, VIEW_MEMBER],
  [ROLES_ID, VIEW_ROLES],
]);

const FLAG_LABELS = {
  ActiveDeveloper: "Active Developer",
  BotHTTPInteractions: "HTTP-only bot",
  BugHunterLevel1: "Bug Hunter Level 1",
  BugHunterLevel2: "Bug Hunter Level 2",
  CertifiedModerator: "Discord Certified Moderator",
  HypeSquadOnlineHouse1: "HypeSquad Bravery",
  HypeSquadOnlineHouse2: "HypeSquad Brilliance",
  HypeSquadOnlineHouse3: "HypeSquad Balance",
  Hypesquad: "HypeSquad Events",
  Partner: "Partnered server owner",
  PremiumEarlySupporter: "Early Nitro supporter",
  Quarantined: "Quarantined",
  Spammer: "Spammer",
  Staff: "Discord staff",
  TeamPseudoUser: "Team account",
  VerifiedBot: "Verified bot",
  VerifiedDeveloper: "Early verified bot developer",
};

const truncate = (value, max) =>
  String(value ?? "").length > max
    ? `${String(value).slice(0, max - 3)}...`
    : String(value ?? "");

const cleanQuery = (value) =>
  truncate(String(value ?? "").replace(/`/g, "'"), MAX_QUERY);

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

function formatTimestamp(value) {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? `<t:${Math.floor(time / 1000)}:f>` : "Unknown";
}

function formatUserTag(user) {
  return user.discriminator && user.discriminator !== "0"
    ? `${user.username}#${user.discriminator}`
    : user.username;
}

function formatFlag(flag) {
  return flag
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase())
    .replace(/ And /g, " and ");
}

function formatFlags(user) {
  const flags = user.flags?.toArray?.() ?? [];

  if (!flags.length) {
    return "None";
  }

  return flags.map((flag) => FLAG_LABELS[flag] || formatFlag(flag)).join(", ");
}

function memberColor(member) {
  if (!member?.displayColor) {
    return BRAND_COLOR;
  }

  return member.displayHexColor?.toUpperCase() || BRAND_COLOR;
}

function memberRoles(member, guild) {
  return member.roles.cache
    .filter((role) => role.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((role) => role);
}

function buildBaseEmbed(client, user, member, title) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "User details",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(memberColor(member))
    .setTitle(title)
    .setFooter({
      text: `User ID ${user.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  const thumbnail = user.displayAvatarURL({ size: 256 });

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return embed;
}

function buildUser(client, user, member) {
  const title = escapeMarkdown(
    member?.displayName || user.globalName || user.username,
  );

  return buildBaseEmbed(client, user, member, title).addFields(
    {
      name: "Username",
      value: escapeMarkdown(formatUserTag(user)),
      inline: true,
    },
    {
      name: "Display name",
      value: escapeMarkdown(user.globalName || user.username),
      inline: true,
    },
    { name: "ID", value: inlineCode(user.id), inline: true },
    {
      name: "Account type",
      value: user.bot ? "Bot" : "Human",
      inline: true,
    },
    {
      name: "Account created",
      value: formatTimestamp(user.createdTimestamp),
      inline: true,
    },
    { name: "Badges", value: formatFlags(user), inline: false },
  );
}

function buildMember(client, user, guild, member) {
  const roles = memberRoles(member, guild);
  const nickname = member.nickname ? escapeMarkdown(member.nickname) : "None";
  const displayName = escapeMarkdown(member.displayName || user.username);
  const highest = roles.length ? roles[0].toString() : "None";
  const color = member.displayColor
    ? member.displayHexColor.toUpperCase()
    : "Default";
  const boosting = member.premiumSince
    ? formatTimestamp(member.premiumSince)
    : "Not boosting";
  const timedOut =
    member.communicationDisabledUntilTimestamp &&
    member.communicationDisabledUntilTimestamp > Date.now()
      ? formatTimestamp(member.communicationDisabledUntilTimestamp)
      : "None";

  return buildBaseEmbed(client, user, member, "Server member").addFields(
    { name: "Server display name", value: displayName, inline: true },
    { name: "Nickname", value: nickname, inline: true },
    {
      name: "Joined",
      value: formatTimestamp(member.joinedTimestamp ?? member.joinedAt),
      inline: true,
    },
    { name: "Highest role", value: highest, inline: true },
    { name: "Roles", value: formatNumber(roles.length), inline: true },
    { name: "Color", value: color, inline: true },
    { name: "Boosting since", value: boosting, inline: true },
    { name: "Timeout ends", value: timedOut, inline: true },
  );
}

function buildRoleFields(roles) {
  const lines = roles.map((role) => `• ${role}`);
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
    name: chunks.length === 1 ? "Roles" : `Roles ${index + 1}`,
    value,
    inline: false,
  }));
}

function buildRoles(client, user, member, guild) {
  const roles = memberRoles(member, guild);
  const embed = buildBaseEmbed(client, user, member, "Roles");

  if (!roles.length) {
    return embed.setDescription("This member has no roles.");
  }

  return embed
    .setDescription(
      `This member has ${formatNumber(roles.length)} role${
        roles.length === 1 ? "" : "s"
      }.`,
    )
    .addFields(buildRoleFields(roles));
}

function buildPages(client, user, guild, member) {
  const pages = [
    {
      key: VIEW_USER,
      label: "User",
      customId: USER_ID,
      embed: buildUser(client, user, member),
    },
  ];

  if (!member) {
    return pages;
  }

  const roles = memberRoles(member, guild);

  pages.push({
    key: VIEW_MEMBER,
    label: "Member",
    customId: MEMBER_ID,
    embed: buildMember(client, user, guild, member),
  });

  if (roles.length) {
    pages.push({
      key: VIEW_ROLES,
      label: "Roles",
      customId: ROLES_ID,
      embed: buildRoles(client, user, member, guild),
    });
  }

  return pages;
}

function buildButtons(pages, selectedKey, disabled = false) {
  if (pages.length < 2) {
    return [];
  }

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
  const components = buildButtons(pages, page.key);

  return {
    embeds: [page.embed],
    ...(components.length ? { components } : {}),
    allowedMentions: { parse: [] },
  };
}

function attachViewer(message, pages) {
  let selected = pages[0].key;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    const view = VIEW_BY_ID.get(interaction.customId);
    const page = pages.find((entry) => entry.key === view);

    if (!page) {
      return;
    }

    selected = page.key;

    await interaction
      .update({
        embeds: [page.embed],
        components: buildButtons(pages, selected),
        allowedMentions: { parse: [] },
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

function userNotFoundEmbed(client, input) {
  return buildErrorEmbed(
    client,
    "User not found",
    `No user matches ${inlineCode(
      cleanQuery(input),
    )}. Mention a user or enter their user ID.`,
  );
}

async function deliver(client, send, { user, guild, refresh = true }) {
  let pages;

  try {
    const fresh =
      refresh && typeof user.fetch === "function"
        ? await user.fetch(true).catch(() => user)
        : user;
    const member = guild
      ? await guild.members.fetch(fresh.id).catch(() => null)
      : null;

    pages = buildPages(client, fresh, guild, member);
  } catch (error) {
    signale.warn(`Whois request failed: ${error.message}`);
    return send({
      embeds: [
        buildErrorEmbed(client, "Could not load this user", "Try again."),
      ],
    });
  }

  const sent = await send(buildPayload(pages, VIEW_USER));

  if (pages.length > 1 && sent?.createMessageComponentCollector) {
    attachViewer(sent, pages);
  }

  return sent;
}

module.exports = {
  name: "whois",
  aliases: ["userinfo", "user"],
  category: "info",
  description: "Show a user's account and server membership",
  usage: "[user]",
  run: async (client, message, args) => {
    const input = args.join(" ").trim();
    let user = message.author;

    if (input) {
      user = await getUserFromArguments(message, input);

      if (!user) {
        return message.reply({ embeds: [userNotFoundEmbed(client, input)] });
      }
    }

    return deliver(client, (payload) => message.reply(payload), {
      user,
      guild: message.guild,
    });
  },
  interaction: {
    data: {
      name: "whois",
      type: 1,
      description: "Show a user's account and server membership",
      options: [
        {
          name: "user",
          type: 6,
          description: "User to show. Defaults to you.",
          required: false,
        },
      ],
    },
    run: async (client, interaction) => {
      const user = interaction.options.getUser("user") || interaction.user;

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        user,
        guild: interaction.guild,
      });
    },
  },
  contextMenu: {
    data: {
      name: "Get User Info",
      type: 2,
    },
    run: async (client, interaction) => {
      await interaction.deferReply();

      let user;

      try {
        user = await client.users.fetch(interaction.targetId, {
          force: true,
        });
      } catch {
        return interaction.editReply({
          embeds: [
            buildErrorEmbed(
              client,
              "Could not load user",
              "Discord did not return this user. Try again.",
            ),
          ],
        });
      }

      return deliver(client, (payload) => interaction.editReply(payload), {
        user,
        guild: interaction.guild,
        refresh: false,
      });
    },
  },
};
