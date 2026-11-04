const {
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
} = require("discord.js");
const signale = require("signale");

const BRAND_COLOR = "#CD1C6C";
const SUCCESS_COLOR = "#22C55E";
const ERROR_COLOR = "#EF4444";
const MAX_MESSAGES = 100;
const RESULT_TIMEOUT = 6_000;

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

function baseEmbed(client) {
  return new EmbedBuilder()
    .setAuthor({
      name: "Purge",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTimestamp();
}

function errorEmbed(client, title, description) {
  return baseEmbed(client)
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description);
}

function resultEmbed(client, { deleted, filter, channel, requester }) {
  const embed = baseEmbed(client);

  if (!deleted) {
    return embed
      .setTitle("No messages deleted")
      .setDescription("No messages matched the filter. Nothing was removed.")
      .setFooter({
        text: `Requested by ${requester}`,
        iconURL: client.user.displayAvatarURL(),
      });
  }

  return embed
    .setColor(SUCCESS_COLOR)
    .setTitle("Messages deleted")
    .setDescription(`Removed ${plural(deleted, "message")} from ${channel}.`)
    .addFields(
      { name: "Deleted", value: formatNumber(deleted), inline: true },
      { name: "Filter", value: filter, inline: true },
    )
    .setFooter({
      text: `Requested by ${requester}`,
      iconURL: client.user.displayAvatarURL(),
    });
}

function serverOnlyEmbed(client) {
  return errorEmbed(
    client,
    "Server only",
    "Run this command in a server to delete messages.",
  );
}

function countErrorEmbed(client) {
  return errorEmbed(
    client,
    "Invalid count",
    "Enter a whole number from 1 to 100.",
  );
}

function optionErrorEmbed(client, prefix) {
  return errorEmbed(
    client,
    "Unknown option",
    `The only option is \`bots\`. Run \`${prefix}purge 10 bots\` to delete bot messages only.`,
  );
}

function failureEmbed(client) {
  return errorEmbed(
    client,
    "Purge failed",
    "Discord did not delete the messages. Check that I can read and manage messages in this channel and try again.",
  );
}

function parseCount(value) {
  const text = String(value ?? "");

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const count = Number(text);
  return count >= 1 && count <= MAX_MESSAGES ? count : null;
}

async function deleteMessages(channel, { count, bots, commandMessageId }) {
  const fetched = await channel.messages.fetch({ limit: MAX_MESSAGES });
  const pool = bots ? fetched.filter((message) => message.author.bot) : fetched;
  const limit = bots || !commandMessageId ? count : count + 1;
  const selected = [...pool.values()].slice(0, limit);

  if (!selected.length) {
    return { deleted: 0 };
  }

  const deleted = await channel.bulkDelete(selected, true);
  const removedCommand =
    commandMessageId && deleted.has(commandMessageId) ? 1 : 0;

  return { deleted: Math.max(deleted.size - removedCommand, 0) };
}

function scheduleDelete(deleteAction) {
  const timer = setTimeout(() => {
    Promise.resolve()
      .then(deleteAction)
      .catch(() => null);
  }, RESULT_TIMEOUT);

  timer.unref?.();
}

module.exports = {
  name: "purge",
  aliases: ["clear"],
  category: "moderation",
  description: "Delete recent messages in this channel",
  clientPermission: "ManageMessages",
  memberPermission: "ManageMessages",
  usage: "<count> [bots]",
  run: async (client, message, args) => {
    if (!message.guild) {
      return message.channel.send({ embeds: [serverOnlyEmbed(client)] });
    }

    const count = parseCount(args[0]);

    if (count === null) {
      return message.channel.send({ embeds: [countErrorEmbed(client)] });
    }

    const option = args[1]?.toLowerCase();
    const bots = option === "bots" || option === "bot";

    if (option && !bots) {
      const prefix =
        client.prefixes.get(message.guild.id) || process.env.PREFIX || "!";

      return message.channel.send({
        embeds: [optionErrorEmbed(client, prefix)],
      });
    }

    let result;

    try {
      result = await deleteMessages(message.channel, {
        count,
        bots,
        commandMessageId: message.id,
      });
    } catch (error) {
      signale.warn(
        `Purge failed (${error.code ?? error.httpStatus ?? "unknown"}): ${error.message}`,
      );
      return message.channel.send({ embeds: [failureEmbed(client)] });
    }

    const sent = await message.channel.send({
      embeds: [
        resultEmbed(client, {
          deleted: result.deleted,
          filter: bots ? "Bot messages" : "All messages",
          channel: message.channel,
          requester: message.author.username,
        }),
      ],
    });

    if (sent?.delete) {
      scheduleDelete(() => sent.delete());
    }

    return sent;
  },
  interaction: {
    data: {
      name: "purge",
      description: "Delete recent messages in this channel",
      type: 1,
      default_member_permissions:
        PermissionsBitField.Flags.ManageMessages.toString(),
      options: [
        {
          name: "count",
          description: "How many messages to delete, from 1 to 100",
          type: 4,
          min_value: 1,
          max_value: MAX_MESSAGES,
          required: true,
        },
        {
          name: "bots",
          description: "Only delete messages sent by bots",
          type: 5,
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

      const count = parseCount(interaction.options.getInteger("count"));
      const bots = interaction.options.getBoolean("bots") === true;

      if (count === null) {
        return interaction.reply({
          embeds: [countErrorEmbed(client)],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      let result;

      try {
        result = await deleteMessages(interaction.channel, { count, bots });
      } catch (error) {
        signale.warn(
          `Purge failed (${error.code ?? error.httpStatus ?? "unknown"}): ${error.message}`,
        );
        return interaction.editReply({
          embeds: [failureEmbed(client)],
        });
      }

      const sent = await interaction.editReply({
        embeds: [
          resultEmbed(client, {
            deleted: result.deleted,
            filter: bots ? "Bot messages" : "All messages",
            channel: interaction.channel,
            requester: interaction.user.username,
          }),
        ],
      });

      scheduleDelete(() => interaction.deleteReply());

      return sent;
    },
  },
};
