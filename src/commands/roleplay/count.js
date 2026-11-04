const { EmbedBuilder, inlineCode } = require("discord.js");
const signale = require("signale");
const { Sequelize } = require("sequelize");
const schemas = require("../../database/schemas");
const {
  BRAND_COLOR,
  buildErrorEmbed,
  cleanQuery,
  memberAvatar,
  memberId,
  memberName,
  resolveTarget,
  usageFor,
} = require("../../utils/roleplay");
const { runPrefixCommand, slashCommand } = require("../../utils/slashCommands");

const MAX_ROWS = 5;

function findRoleplayCommand(client, input) {
  const name = input.toLowerCase();
  const command =
    client.commands.get(name) || client.commands.get(client.aliases.get(name));

  if (!command || command.category !== "roleplay" || !command.roleplay) {
    return null;
  }

  return command;
}

async function fetchUserName(client, userId) {
  const cached = client.users.cache?.get?.(userId);
  const user =
    cached ||
    (typeof client.users.fetch === "function"
      ? await client.users.fetch(userId).catch(() => null)
      : null);

  if (!user) {
    return "Unknown member";
  }

  return memberName(user, user);
}

function countLine(index, name, total) {
  return `${index + 1}. ${name}: ${Number(total).toLocaleString("en-US")} ${
    Number(total) === 1 ? "time" : "times"
  }`;
}

function buildCountEmbed(client, target, command, rows, names) {
  const targetName = memberName(target, target.user);
  const avatar = memberAvatar(target, target.user);
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Roleplay counts",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(`${command.roleplay.label} counts for ${targetName}`)
    .setDescription(
      rows
        .map((row, index) =>
          countLine(index, names[index], row.dataValues.total),
        )
        .join("\n"),
    )
    .setFooter({
      text: `Showing ${rows.length} member${rows.length === 1 ? "" : "s"}`,
    })
    .setTimestamp();

  if (avatar) {
    embed.setThumbnail(avatar);
  }

  return embed;
}

function buildEmptyEmbed(client, message, target, command) {
  const targetName = memberName(target, target.user);
  const avatar = memberAvatar(target, target.user);
  const isSelf = memberId(target, target.user) === message.author.id;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Roleplay counts",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(`${command.roleplay.label} counts for ${targetName}`)
    .setDescription(
      [
        `No records for ${isSelf ? "you" : targetName} yet.`,
        "",
        `Run ${inlineCode(usageFor(client, message, command))} to add one.`,
      ].join("\n"),
    )
    .setTimestamp();

  if (avatar) {
    embed.setThumbnail(avatar);
  }

  return embed;
}

function buildUsageError(client, message) {
  return buildErrorEmbed(
    client,
    "Action required",
    [
      "Provide a roleplay action to count.",
      "",
      `Usage: ${inlineCode(usageFor(client, message, module.exports))}`,
    ].join("\n"),
    "Roleplay counts",
  );
}

function buildUnknownAction(client, message, input) {
  return buildErrorEmbed(
    client,
    "Unknown action",
    [
      `${inlineCode(cleanQuery(input))} is not a roleplay action.`,
      "Use an action that targets a member, such as `hug`, `kiss`, or `slap`.",
      "",
      `Usage: ${inlineCode(usageFor(client, message, module.exports))}`,
    ].join("\n"),
    "Roleplay counts",
  );
}

function buildSoloAction(client, command) {
  return buildErrorEmbed(
    client,
    "No count for this action",
    `${inlineCode(command.name)} does not target a member, so there is nothing to count.`,
    "Roleplay counts",
  );
}

function buildMemberError(client, message, input) {
  const description = input
    ? [
        `No member matches ${inlineCode(cleanQuery(input))}.`,
        "Mention a member, use their user ID, or reply to their message.",
        "",
        `Usage: ${inlineCode(usageFor(client, message, module.exports))}`,
      ].join("\n")
    : "Could not load your member record for this server. Try again.";

  return buildErrorEmbed(
    client,
    "Member not found",
    description,
    "Roleplay counts",
  );
}

function buildQueryError(client) {
  return buildErrorEmbed(
    client,
    "Count unavailable",
    "Jasmine could not load the action counts. Try again in a moment.",
    "Roleplay counts",
  );
}

module.exports = {
  name: "count",
  description: "Show who has used an action most on a member",
  category: "roleplay",
  usage: "<action> [member]",
  run: async (client, message, args) => {
    if (!message.guild) {
      return message.reply({
        embeds: [
          buildErrorEmbed(
            client,
            "Server only",
            "This command only works in a server.",
            "Roleplay counts",
          ),
        ],
      });
    }

    const input = (args[0] || "").trim();

    if (!input) {
      return message.reply({ embeds: [buildUsageError(client, message)] });
    }

    const command = findRoleplayCommand(client, input);

    if (!command) {
      return message.reply({
        embeds: [buildUnknownAction(client, message, input)],
      });
    }

    if (!command.roleplay.countable) {
      return message.reply({ embeds: [buildSoloAction(client, command)] });
    }

    const resolved = await resolveTarget(message, args.slice(1));
    let target = resolved.target;

    if (!target && resolved.missing) {
      target = message.member;

      if (!target) {
        target = await message.guild.members
          .fetch(message.author.id)
          .catch(() => null);
      }
    }

    if (!target) {
      return message.reply({
        embeds: [buildMemberError(client, message, resolved.input)],
      });
    }

    let rows;

    try {
      rows = await schemas.roleplay().findAll({
        attributes: [
          "userID",
          [Sequelize.fn("COUNT", Sequelize.col("userID")), "total"],
        ],
        where: {
          targetId: memberId(target, target.user),
          actionType: command.roleplay.action,
        },
        group: ["userID"],
        order: [[Sequelize.literal("total"), "DESC"]],
        limit: MAX_ROWS,
      });
    } catch (error) {
      signale.warn(
        `Roleplay count query failed for ${command.roleplay.action}: ${error.message}`,
      );

      return message.reply({ embeds: [buildQueryError(client)] });
    }

    if (!rows.length) {
      return message.reply({
        embeds: [buildEmptyEmbed(client, message, target, command)],
        allowedMentions: { parse: [] },
      });
    }

    const names = await Promise.all(
      rows.map((row) => fetchUserName(client, row.dataValues.userID)),
    );

    return message.reply({
      embeds: [buildCountEmbed(client, target, command, rows, names)],
      allowedMentions: { parse: [] },
    });
  },
  interaction: {
    data: slashCommand(
      "count",
      "Show who has used an action most on a member",
      (builder) =>
        builder
          .addStringOption((option) =>
            option
              .setName("action")
              .setDescription("Action to count")
              .setRequired(true),
          )
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("Member to check. Defaults to you.")
              .setRequired(false),
          ),
    ),
    run: async (client, interaction) => {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply().catch(() => null);
      }

      const args = [interaction.options.getString("action", true)];
      const user = interaction.options.getUser("user");

      if (user) {
        args.push(user.id);
      }

      return runPrefixCommand(client, interaction, module.exports, args);
    },
  },
};
