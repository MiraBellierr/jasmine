const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  escapeMarkdown,
  inlineCode,
} = require("discord.js");
const { getUserFromArguments } = require("../../utils/getters");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_QUERY = 50;

const VIEW_AVATAR = "avatar";
const VIEW_SERVER = "server";
const VIEW_BANNER = "banner";

const FORMAT_LABELS = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
  gif: "GIF",
};

const truncate = (value, max) =>
  String(value ?? "").length > max
    ? `${String(value).slice(0, max - 3)}...`
    : String(value ?? "");

const cleanQuery = (value) =>
  truncate(String(value ?? "").replace(/`/g, "'"), MAX_QUERY);

const isAnimated = (hash) => Boolean(hash?.startsWith("a_"));

function formatLinks(urlFor, animated) {
  const formats = ["png", "jpg", "webp"];

  if (animated) {
    formats.push("gif");
  }

  return `-# Formats: ${formats
    .map((format) => `[${FORMAT_LABELS[format]}](${urlFor(format)})`)
    .join(" • ")}`;
}

function buildAssetEmbed(client, user, { title, image, description }) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setImage(image)
    .setFooter({
      text: `User ID ${user.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

async function buildPages(client, user, guild, { refresh = true } = {}) {
  const fresh = refresh ? await user.fetch(true).catch(() => user) : user;
  const member = guild
    ? await guild.members.fetch(fresh.id).catch(() => null)
    : null;
  const name = escapeMarkdown(fresh.username);
  const pages = [];

  pages.push({
    key: VIEW_AVATAR,
    label: "Avatar",
    customId: `avatar:view:${VIEW_AVATAR}`,
    embed: buildAssetEmbed(client, fresh, {
      title: `${name}'s avatar`,
      image: fresh.displayAvatarURL({ size: 4096 }),
      description: fresh.avatar
        ? formatLinks(
            (extension) => fresh.displayAvatarURL({ size: 4096, extension }),
            isAnimated(fresh.avatar),
          )
        : "This user has no custom avatar. Discord shows its default avatar.",
    }),
  });

  const serverAvatar = member?.avatarURL({ size: 4096 });

  if (serverAvatar) {
    pages.push({
      key: VIEW_SERVER,
      label: "Server avatar",
      customId: `avatar:view:${VIEW_SERVER}`,
      embed: buildAssetEmbed(client, fresh, {
        title: `${name}'s server avatar`,
        image: serverAvatar,
        description: formatLinks(
          (extension) => member.avatarURL({ size: 4096, extension }),
          isAnimated(member.avatar),
        ),
      }),
    });
  }

  const banner = fresh.bannerURL({ size: 4096 });

  if (banner) {
    pages.push({
      key: VIEW_BANNER,
      label: "Banner",
      customId: `avatar:view:${VIEW_BANNER}`,
      embed: buildAssetEmbed(client, fresh, {
        title: `${name}'s banner`,
        image: banner,
        description: formatLinks(
          (extension) => fresh.bannerURL({ size: 4096, extension }),
          isAnimated(fresh.banner),
        ),
      }),
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
  };
}

function attachViewer(message, pages, { ownerId, commandLabel }) {
  let selected = pages[0].key;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction
        .reply({
          content: `Only the person who ran the command can use these buttons. Run ${commandLabel} to see your own avatar.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return;
    }

    const page = pages.find((entry) => entry.customId === interaction.customId);

    if (!page) {
      return;
    }

    selected = page.key;

    await interaction
      .update({
        embeds: [page.embed],
        components: buildButtons(pages, selected),
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

async function deliver(
  client,
  send,
  { user, guild, ownerId, commandLabel, refresh = true },
) {
  const pages = await buildPages(client, user, guild, { refresh });
  const sent = await send(buildPayload(pages, VIEW_AVATAR));

  if (pages.length > 1 && sent?.createMessageComponentCollector) {
    attachViewer(sent, pages, { ownerId, commandLabel });
  }

  return sent;
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

module.exports = {
  name: "avatar",
  aliases: ["av"],
  category: "info",
  description: "Show a user's avatar, server avatar, and banner",
  usage: "[user]",
  run: async (client, message, args) => {
    const input = args.join(" ").trim();
    let user = message.author;

    if (input) {
      user = await getUserFromArguments(message, input);

      if (!user) {
        return message.reply({
          embeds: [
            buildErrorEmbed(
              client,
              "User not found",
              `No user matches ${inlineCode(
                cleanQuery(input),
              )}. Mention a user or enter their user ID.`,
            ),
          ],
        });
      }
    }

    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";

    return deliver(client, (payload) => message.reply(payload), {
      user,
      guild: message.guild,
      ownerId: message.author.id,
      commandLabel: `\`${prefix}avatar\``,
    });
  },
  interaction: {
    data: {
      name: "avatar",
      type: 1,
      description: "Show a user's avatar, server avatar, and banner",
      options: [
        {
          name: "user",
          type: 6,
          description: "User whose avatar to show",
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
        ownerId: interaction.user.id,
        commandLabel: "`/avatar`",
      });
    },
  },
  contextMenu: {
    data: {
      name: "Get User Avatar",
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
        ownerId: interaction.user.id,
        commandLabel: "`/avatar`",
        refresh: false,
      });
    },
  },
};
