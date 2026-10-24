const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  inlineCode,
} = require("discord.js");
const { supportServer } = require("../../utils/constants");

const BRAND_COLOR = "#CD1C6C";
const MENU_TIMEOUT = 60_000;
const MAX_LIST_LENGTH = 3600;

const INVITE_URL =
  "https://discord.com/api/oauth2/authorize?client_id=969633016089546763&permissions=0&scope=bot%20applications.commands";

const CATEGORY_META = {
  anime: {
    emoji: "🌸",
    color: "#F472B6",
    blurb:
      "Search anime and manga, check the rankings, send character images, view Star Rail profiles and cards, or get a random quote.",
  },
  info: {
    emoji: "📊",
    color: "#38BDF8",
    blurb: "Look up users, roles and servers.",
  },
  meme: {
    emoji: "😂",
    color: "#FBBF24",
    blurb: "Send a random meme from Reddit.",
  },
  moderation: {
    emoji: "🛡️",
    color: "#F87171",
    blurb: "Set up logging and delete messages.",
  },
  roleplay: {
    emoji: "🎭",
    color: "#A78BFA",
    blurb: "Hug, kiss, slap and interact with other members.",
  },
  rpg: {
    emoji: "⚔️",
    color: "#34D399",
    blurb: "Register, battle and manage your inventory.",
  },
  utility: {
    emoji: "🧰",
    color: BRAND_COLOR,
    blurb:
      "Create polls and giveaways, look things up and change server settings.",
  },
};

const DEFAULT_META = {
  emoji: "📁",
  color: BRAND_COLOR,
  blurb: "No category assigned.",
};

const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const metaFor = (category) => CATEGORY_META[category] || DEFAULT_META;

const getPrefix = (client, guildId) =>
  (guildId && client.prefixes.get(guildId)) || process.env.PREFIX || "!";

const findCommand = (client, input) => {
  const name = input.toLowerCase();
  return (
    client.commands.get(name) || client.commands.get(client.aliases.get(name))
  );
};

const commandMark = (cmd, prefix, slash) =>
  slash ? `/${cmd.name}` : `${prefix}${cmd.name}`;

const helpUsage = (prefix, slash) =>
  slash ? "`/help <command>`" : `\`${prefix}help <command>\``;

const rawInteractionData = (entry) => {
  if (!entry || !entry.data) {
    return null;
  }

  return typeof entry.data.toJSON === "function"
    ? entry.data.toJSON()
    : entry.data;
};

const interactionData = (cmd) => rawInteractionData(cmd.interaction);
const contextMenuData = (cmd) => rawInteractionData(cmd.contextMenu);

const isSlashCommand = (cmd) => interactionData(cmd)?.type === 1;

const commandsIn = (client, category, slash) =>
  [...client.commands.values()]
    .filter(
      (cmd) => cmd.category === category && (!slash || isSlashCommand(cmd)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

const cleanQuery = (input) =>
  input
    .replace(/[`\n\r]/g, " ")
    .trim()
    .slice(0, 50);

function buildOverview(client, { prefix, slash }) {
  const categories = client.categories.map((category) => ({
    category,
    meta: metaFor(category),
    commands: commandsIn(client, category, slash),
  }));
  const total = categories.reduce(
    (sum, category) => sum + category.commands.length,
    0,
  );
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} • Help`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      [
        "Browse every command by category.",
        "",
        `-# Pick a category below, or run ${helpUsage(
          prefix,
          slash,
        )} for usage and aliases.`,
        `-# [Invite Jasmine](${INVITE_URL}) • [Support Server](${supportServer.url})`,
      ].join("\n"),
    )
    .setTimestamp()
    .setFooter({
      text: `${total} commands • ${categories.length} categories`,
      iconURL: client.user.displayAvatarURL(),
    });

  for (const { category, meta, commands } of categories) {
    const samples = commands
      .slice(0, 5)
      .map((cmd) => `\`${cmd.name}\``)
      .join(" ");
    const extra = commands.length > 5 ? ` +${commands.length - 5} more` : "";

    embed.addFields({
      name: `${meta.emoji} ${titleCase(category)}`,
      value: `**${commands.length}** command${
        commands.length === 1 ? "" : "s"
      }${samples ? `\n${samples}${extra}` : ""}`,
      inline: true,
    });
  }

  return embed;
}

function buildCategory(client, category, { prefix, slash }) {
  const meta = metaFor(category);
  const commands = commandsIn(client, category, slash);

  let list = commands
    .map(
      (cmd) =>
        `**\`${commandMark(cmd, prefix, slash)}\`**: ${
          cmd.description || "No description provided."
        }`,
    )
    .join("\n");

  if (list.length > MAX_LIST_LENGTH) {
    const clipped = list.slice(0, MAX_LIST_LENGTH);
    const lastLine = clipped.lastIndexOf("\n");
    list = `${clipped.slice(
      0,
      lastLine > 0 ? lastLine : MAX_LIST_LENGTH,
    )}\n-# More commands not shown. Run ${helpUsage(
      prefix,
      slash,
    )} to look one up.`;
  }

  return new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} • Help`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${titleCase(category)}`)
    .setDescription(
      commands.length
        ? `${meta.blurb}\n\n${list}`
        : `${meta.blurb}\n\n*No commands here yet.*`,
    )
    .setTimestamp()
    .setFooter({
      text: `${commands.length} command${commands.length === 1 ? "" : "s"}`,
      iconURL: client.user.displayAvatarURL(),
    });
}

function buildCommand(client, cmd, { prefix }) {
  const meta = metaFor(cmd.category);
  const usage = cmd.usage ? ` ${cmd.usage}` : "";

  const fields = [
    {
      name: "Usage",
      value: `\`${prefix}${cmd.name}${usage}\``,
    },
  ];

  const interaction = interactionData(cmd);

  if (interaction?.type === 1) {
    fields.push({
      name: "Slash command",
      value: `\`/${interaction.name}\``,
      inline: true,
    });
  } else if (interaction?.type === 2) {
    fields.push({
      name: "Context menu",
      value: `\`${interaction.name}\``,
      inline: true,
    });
  }

  const contextMenu = contextMenuData(cmd);

  if (contextMenu?.type === 2 && contextMenu.name !== interaction?.name) {
    fields.push({
      name: "Context menu",
      value: `\`${contextMenu.name}\``,
      inline: true,
    });
  }

  const aliases = cmd.aliases || [];
  fields.push({
    name: "Aliases",
    value: aliases.length
      ? aliases.map((alias) => `\`${alias}\``).join(", ")
      : "None",
    inline: true,
  });

  fields.push({
    name: "Category",
    value: `${meta.emoji} ${cmd.category ? titleCase(cmd.category) : "Other"}`,
    inline: true,
  });

  if (cmd.memberPermission) {
    fields.push({
      name: "Required permission",
      value: `\`${cmd.memberPermission}\``,
      inline: true,
    });
  }

  return new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} • Help`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${cmd.name}`)
    .setDescription(cmd.description || "*No description provided.*")
    .addFields(fields)
    .setTimestamp()
    .setFooter({
      text: "Syntax: <> required • [] optional",
      iconURL: client.user.displayAvatarURL(),
    });
}

function buildNotFound(client, input, prefix) {
  return new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} • Help`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor("#EF4444")
    .setDescription(
      `No command matches ${inlineCode(
        cleanQuery(input),
      )}.\n-# Run \`${prefix}help\` to browse every category.`,
    )
    .setTimestamp();
}

function buildMenu(client, selected, { prefix, slash, disabled = false }) {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel("Overview")
      .setDescription("Show command counts for every category")
      .setEmoji("🏠")
      .setValue("overview")
      .setDefault(selected === "overview"),
  ];

  for (const category of client.categories) {
    const meta = metaFor(category);
    const count = commandsIn(client, category, slash).length;

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(titleCase(category))
        .setDescription(
          `${count} command${count === 1 ? "" : "s"} • ${meta.blurb}`.slice(
            0,
            100,
          ),
        )
        .setEmoji(meta.emoji)
        .setValue(category)
        .setDefault(selected === category),
    );
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId("helpMenu")
    .setPlaceholder(
      disabled
        ? `Help menu closed. Run ${slash ? "/help" : `${prefix}help`} again`
        : "Choose a category",
    )
    .addOptions(options)
    .setDisabled(disabled);

  return new ActionRowBuilder().addComponents(menu);
}

function attachMenu(client, message, { userId, prefix, slash }) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: MENU_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== userId) {
      await interaction
        .reply({
          content: `This menu belongs to someone else. Run ${
            slash ? "`/help`" : `\`${prefix}help\``
          } to open your own.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return;
    }

    const selected = interaction.values[0];
    const category = client.categories.includes(selected)
      ? selected
      : "overview";
    const embed =
      category === "overview"
        ? buildOverview(client, { prefix, slash })
        : buildCategory(client, category, { prefix, slash });

    try {
      await interaction.update({
        embeds: [embed],
        components: [buildMenu(client, category, { prefix, slash })],
      });
    } catch {
      collector.stop();
    }
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({
        components: [
          buildMenu(client, "overview", { prefix, slash, disabled: true }),
        ],
      });
    } catch {
      // The message was deleted or can no longer be edited.
    }
  });
}

async function getCMD(client, message, input) {
  const prefix = getPrefix(client, message.guild.id);
  const cmd = findCommand(client, input);

  if (!cmd) {
    return message.reply({
      embeds: [buildNotFound(client, input, prefix)],
    });
  }

  return message.reply({
    embeds: [buildCommand(client, cmd, { prefix })],
  });
}

module.exports = {
  name: "help",
  aliases: ["h"],
  category: "utility",
  description: "Lists every command, or shows details for one",
  usage: "[command | alias]",
  run: async (client, message, args) => {
    if (args[0]) {
      return getCMD(client, message, args[0]);
    }

    const prefix = getPrefix(client, message.guild.id);
    const sent = await message.reply({
      embeds: [buildOverview(client, { prefix, slash: false })],
      components: [buildMenu(client, "overview", { prefix, slash: false })],
    });

    return attachMenu(client, sent, {
      userId: message.author.id,
      prefix,
      slash: false,
    });
  },
  interaction: {
    data: {
      name: "help",
      type: 1,
      description: "Browse every command, or look one up",
      options: [
        {
          name: "command",
          description: "Show details for one command",
          type: 3,
          required: false,
        },
      ],
    },
    run: async (client, interaction) => {
      const prefix = getPrefix(client, interaction.guildId);
      const input = interaction.options?.getString("command")?.trim();

      if (input) {
        const cmd = findCommand(client, input);

        if (!cmd) {
          return interaction.reply({
            embeds: [buildNotFound(client, input, prefix)],
            flags: MessageFlags.Ephemeral,
          });
        }

        return interaction.reply({
          embeds: [buildCommand(client, cmd, { prefix })],
        });
      }

      await interaction.reply({
        embeds: [buildOverview(client, { prefix, slash: true })],
        components: [buildMenu(client, "overview", { prefix, slash: true })],
      });

      const sent = await interaction.fetchReply();

      return attachMenu(client, sent, {
        userId: interaction.user.id,
        prefix,
        slash: true,
      });
    },
  },
};
