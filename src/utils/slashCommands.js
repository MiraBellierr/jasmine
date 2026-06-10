const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");

const loadingMessages = new Set(["*Please wait...*", "🏓 Pinging...."]);

function normalizePayload(payload) {
  if (typeof payload === "string") {
    return { content: payload };
  }

  return payload;
}

async function sendInteraction(interaction, payload, options = {}) {
  const response = {
    ...normalizePayload(payload),
  };

  if (options.ephemeral) {
    response.ephemeral = true;
  }

  if (interaction.deferred && !interaction.replied) {
    return interaction.editReply(response);
  }

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ ...response, fetchReply: true });
  }

  return interaction.reply({ ...response, fetchReply: true });
}

function createPlaceholderMessage(interaction, content) {
  return {
    id: interaction.id,
    content,
    createdTimestamp: Date.now(),
    delete: async () => null,
  };
}

function createInteractionMessage(client, interaction, options = {}) {
  const channel = Object.create(interaction.channel || {});

  channel.send = async (payload) => {
    const normalized = normalizePayload(payload);

    if (
      normalized.content &&
      loadingMessages.has(normalized.content) &&
      !interaction.deferred &&
      !interaction.replied
    ) {
      await interaction.deferReply({ ephemeral: options.ephemeral });
      return createPlaceholderMessage(interaction, normalized.content);
    }

    return sendInteraction(interaction, payload, options);
  };

  return {
    client,
    guild: interaction.guild,
    channel,
    author: interaction.user,
    user: interaction.user,
    member: interaction.member,
    createdTimestamp: interaction.createdTimestamp,
    reference: null,
    mentions: {
      size: 0,
      users: { first: () => null },
      members: { first: () => null },
      channels: { first: () => null },
      roles: { first: () => null },
    },
    get deferred() {
      return interaction.deferred;
    },
    get replied() {
      return interaction.replied;
    },
    reply: (payload) => sendInteraction(interaction, payload, options),
  };
}

function runPrefixCommand(client, interaction, command, args = [], options = {}) {
  const message = createInteractionMessage(client, interaction, options);

  return command.run(client, message, args);
}

function truncateDescription(description, fallback) {
  const text = description || fallback;

  return text.length > 100 ? text.slice(0, 97) + "..." : text;
}

function slashCommand(name, description, configure) {
  const builder = new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(truncateDescription(description, `Run ${name}`));

  if (configure) {
    configure(builder);
  }

  return builder;
}

function applyDefaultPermission(builder, permission) {
  if (permission && PermissionFlagsBits[permission]) {
    builder.setDefaultMemberPermissions(PermissionFlagsBits[permission]);
  }

  return builder;
}

function roleplayInteraction(name, description, options = {}) {
  const hasTarget = options.target === "required" || options.target === "optional";

  return {
    data: slashCommand(name, description, (builder) => {
      if (hasTarget) {
        builder.addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to target")
            .setRequired(options.target === "required"),
        );
      }
    }),
    run: async (client, interaction) => {
      const user = hasTarget ? interaction.options.getUser("user") : null;
      const args = user ? [user.id] : [];

      return runPrefixCommand(client, interaction, options.command(), args);
    },
  };
}

function textOption(option, name, description, required = true) {
  return option
    .setName(name)
    .setDescription(truncateDescription(description, name))
    .setRequired(required);
}

function channelOption(option, name, description, required = true) {
  return option
    .setName(name)
    .setDescription(truncateDescription(description, name))
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setRequired(required);
}

module.exports = {
  applyDefaultPermission,
  channelOption,
  createInteractionMessage,
  roleplayInteraction,
  runPrefixCommand,
  sendInteraction,
  slashCommand,
  textOption,
};
