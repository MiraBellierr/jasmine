const { EmbedBuilder, escapeMarkdown, inlineCode } = require("discord.js");
const signale = require("signale");
const utils = require("./utils");
const { getMemberFromArguments } = require("./getters");
const { getCount } = require("./economies");
const { roleplayInteraction } = require("./slashCommands");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const MAX_QUERY = 50;

function truncate(value, max) {
  const text = String(value ?? "");

  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function cleanQuery(value) {
  return truncate(
    String(value ?? "")
      .replace(/`/g, "'")
      .replace(/\s+/g, " ")
      .trim(),
    MAX_QUERY,
  );
}

function memberName(member, user) {
  const name =
    member?.displayName ||
    member?.nick ||
    user?.globalName ||
    user?.username ||
    member?.username ||
    "Unknown member";

  return escapeMarkdown(String(name).replace(/\s+/g, " ").trim());
}

function memberId(member, user) {
  return user?.id || member?.user?.id || member?.id;
}

function memberAvatar(member, user) {
  const source = user || member?.user || member;

  return typeof source?.displayAvatarURL === "function"
    ? source.displayAvatarURL({ size: 128 })
    : undefined;
}

function getPrefix(client, message) {
  return (
    (message.guild && client.prefixes.get(message.guild.id)) ||
    process.env.PREFIX ||
    "!"
  );
}

function usageFor(client, message, command) {
  if (message.isInteraction) {
    return `/${command.name}`;
  }

  const suffix = command.usage ? ` ${command.usage}` : "";
  return `${getPrefix(client, message)}${command.name}${suffix}`;
}

function buildErrorEmbed(client, title, description, author = "Roleplay") {
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

function buildActionEmbed(client, message, label, description, url, footer) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: label,
      iconURL: message.author.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setDescription(description)
    .setImage(url)
    .setTimestamp();

  if (footer?.text) {
    embed.setFooter({
      text: footer.text,
      ...(footer.iconURL ? { iconURL: footer.iconURL } : {}),
    });
  }

  return embed;
}

async function resolveReferencedMember(message) {
  const messageId = message.reference?.messageId;

  if (!messageId || !message.channel?.messages) {
    return null;
  }

  let referenced = message.channel.messages.cache?.get?.(messageId);

  if (!referenced && typeof message.channel.messages.fetch === "function") {
    referenced = await message.channel.messages
      .fetch(messageId)
      .catch(() => null);
  }

  if (!referenced) {
    return null;
  }

  if (referenced.member) {
    return referenced.member;
  }

  const authorId = referenced.author?.id;

  if (!authorId || typeof message.guild?.members?.fetch !== "function") {
    return null;
  }

  return message.guild.members.fetch(authorId).catch(() => null);
}

async function resolveTarget(message, args) {
  const referenced = await resolveReferencedMember(message);

  if (referenced) {
    return { target: referenced, input: "", missing: false };
  }

  const input = args.join(" ").trim();

  if (!input) {
    return { target: null, input: "", missing: true };
  }

  const target = await getMemberFromArguments(message, input);
  return { target, input, missing: false };
}

function targetSentence(config, actorName, targetName) {
  if (typeof config.targetLine === "function") {
    return `${actorName} ${config.targetLine(targetName)}.`;
  }

  return `${actorName} ${config.targetLine} ${targetName}.`;
}

function selfSentence(config, botName, actorName) {
  const line = config.selfLine || config.targetLine;

  if (typeof line === "function") {
    return `${botName} ${line(actorName)}.`;
  }

  return `${botName} ${line} ${actorName}.`;
}

function countFooter(config, count, target) {
  const times = count === 1 ? "time" : "times";

  return {
    text: `${config.countLine} ${count} ${times}.`,
    iconURL: memberAvatar(target, target.user),
  };
}

async function sendImageError(client, message, action, error) {
  signale.warn(
    `Roleplay image failed for ${action}: ${error?.message || error}`,
  );

  return message.reply({
    embeds: [
      buildErrorEmbed(
        client,
        "Image unavailable",
        "The image service did not return an image. Try again in a moment.",
      ),
    ],
  });
}

async function runRoleplay(client, message, args, config) {
  if (!message.guild) {
    return message.reply({
      embeds: [
        buildErrorEmbed(
          client,
          "Server only",
          "This command only works in a server.",
        ),
      ],
    });
  }

  const actorName = memberName(message.member, message.author);
  const botName = escapeMarkdown(client.user.username);

  const sendSolo = async () => {
    let url;

    try {
      url = await utils.nekoapi(config.action);
    } catch (error) {
      return sendImageError(client, message, config.action, error);
    }

    const embed = buildActionEmbed(
      client,
      message,
      config.label,
      `${actorName} ${config.soloLine}.`,
      url,
    );

    return message.reply({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
  };

  const sendTarget = async (target) => {
    let url;

    try {
      url = await utils.nekoapi(config.action);
    } catch (error) {
      return sendImageError(client, message, config.action, error);
    }

    let count;

    try {
      count = await getCount(message, target, config.action);
    } catch (error) {
      signale.warn(
        `Roleplay count failed for ${config.action}: ${error.message}`,
      );

      return message.reply({
        embeds: [
          buildErrorEmbed(
            client,
            "Action unavailable",
            "Jasmine could not save this action. Try again in a moment.",
          ),
        ],
      });
    }

    const targetName = memberName(target, target.user);
    const embed = buildActionEmbed(
      client,
      message,
      config.label,
      targetSentence(config, actorName, targetName),
      url,
      countFooter(config, count, target),
    );

    return message.reply({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
  };

  const sendSelf = async () => {
    let url;

    try {
      url = await utils.nekoapi(config.action);
    } catch (error) {
      return sendImageError(client, message, config.action, error);
    }

    const embed = buildActionEmbed(
      client,
      message,
      config.label,
      selfSentence(config, botName, actorName),
      url,
    );

    return message.reply({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
  };

  if (config.target === "none") {
    return sendSolo();
  }

  const { target, input, missing } = await resolveTarget(message, args);

  if (missing) {
    if (config.target === "optional") {
      return sendSolo();
    }

    return message.reply({
      embeds: [
        buildErrorEmbed(
          client,
          "Member required",
          [
            "Mention a member, use their user ID, or reply to their message.",
            "",
            `Usage: ${inlineCode(usageFor(client, message, config))}`,
          ].join("\n"),
        ),
      ],
    });
  }

  if (!target) {
    return message.reply({
      embeds: [
        buildErrorEmbed(
          client,
          "Member not found",
          [
            `No member matches ${inlineCode(cleanQuery(input))}.`,
            "Mention a member, use their user ID, or reply to their message.",
            "",
            `Usage: ${inlineCode(usageFor(client, message, config))}`,
          ].join("\n"),
        ),
      ],
    });
  }

  if (memberId(target, target.user) === message.author.id) {
    return sendSelf();
  }

  return sendTarget(target);
}

function createRoleplayCommand(options) {
  const {
    name,
    description,
    aliases,
    target = "none",
    usage,
    label = name.charAt(0).toUpperCase() + name.slice(1),
    soloLine,
    targetLine,
    selfLine,
    countLine,
    action = name,
  } = options;

  if (!name || !description) {
    throw new Error("Roleplay commands need a name and description.");
  }

  if (target === "required" && !targetLine) {
    throw new Error(`${name} needs a targetLine.`);
  }

  if (target === "optional" && (!targetLine || !soloLine)) {
    throw new Error(`${name} needs a targetLine and a soloLine.`);
  }

  if (target === "none" && !soloLine) {
    throw new Error(`${name} needs a soloLine.`);
  }

  if (target !== "none" && !countLine) {
    throw new Error(`${name} needs a countLine.`);
  }

  const resolvedUsage =
    usage ||
    (target === "required"
      ? "<member>"
      : target === "optional"
        ? "[member]"
        : undefined);

  const config = {
    name,
    description,
    label,
    target,
    action,
    soloLine,
    targetLine,
    selfLine,
    countLine,
    usage: resolvedUsage,
  };

  const command = {
    name,
    ...(aliases?.length ? { aliases } : {}),
    description,
    category: "roleplay",
    ...(resolvedUsage ? { usage: resolvedUsage } : {}),
    roleplay: {
      action,
      target,
      countable: target !== "none",
      label,
    },
    run: async (client, message, args) =>
      runRoleplay(client, message, args, config),
  };

  command.interaction = roleplayInteraction(name, description, {
    target: target === "required" || target === "optional" ? target : undefined,
    command: () => command,
  });

  return command;
}

module.exports = {
  BRAND_COLOR,
  ERROR_COLOR,
  buildErrorEmbed,
  cleanQuery,
  createRoleplayCommand,
  getPrefix,
  memberAvatar,
  memberId,
  memberName,
  resolveTarget,
  usageFor,
};
