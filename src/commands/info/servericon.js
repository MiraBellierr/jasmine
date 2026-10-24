const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  escapeMarkdown,
} = require("discord.js");

const BRAND_COLOR = "#CD1C6C";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;

const VIEW_ICON = "icon";
const VIEW_SPLASH = "splash";
const VIEW_BANNER = "banner";
const VIEW_DISCOVERY = "discovery";

const FORMAT_LABELS = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
  gif: "GIF",
};

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

function buildAssetEmbed(client, guild, { title, image, description }) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: `Server ID ${guild.id}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (image) {
    embed.setImage(image);
  }

  return embed;
}

function buildPages(client, guild) {
  const pages = [];
  const name = escapeMarkdown(guild.name);

  const addPage = ({ key, label, title, hash, url }) => {
    const image = url({ size: 4096 });

    if (!image) {
      return;
    }

    pages.push({
      key,
      label,
      customId: `servericon:view:${key}`,
      embed: buildAssetEmbed(client, guild, {
        title,
        image,
        description: formatLinks(
          (extension) => url({ size: 4096, extension }),
          isAnimated(hash),
        ),
      }),
    });
  };

  addPage({
    key: VIEW_ICON,
    label: "Icon",
    title: `${name}'s icon`,
    hash: guild.icon,
    url: (options) => guild.iconURL(options),
  });

  addPage({
    key: VIEW_SPLASH,
    label: "Invite splash",
    title: `${name}'s invite splash`,
    hash: guild.splash,
    url: (options) => guild.splashURL(options),
  });

  addPage({
    key: VIEW_BANNER,
    label: "Banner",
    title: `${name}'s banner`,
    hash: guild.banner,
    url: (options) => guild.bannerURL(options),
  });

  addPage({
    key: VIEW_DISCOVERY,
    label: "Discovery splash",
    title: `${name}'s discovery splash`,
    hash: guild.discoverySplash,
    url: (options) => guild.discoverySplashURL(options),
  });

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

function attachViewer(message, pages) {
  let selected = pages[0].key;

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
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

function emptyEmbed(client, guild) {
  return buildAssetEmbed(client, guild, {
    title: "No server images",
    description: "This server has no icon, banner, or splash image.",
  });
}

async function deliver(client, send, guild) {
  const pages = buildPages(client, guild);

  if (!pages.length) {
    return send({ embeds: [emptyEmbed(client, guild)] });
  }

  const sent = await send(buildPayload(pages, pages[0].key));

  if (pages.length > 1 && sent?.createMessageComponentCollector) {
    attachViewer(sent, pages);
  }

  return sent;
}

module.exports = {
  name: "servericon",
  aliases: ["si"],
  category: "info",
  description:
    "Show the server's icon, invite splash, banner, and discovery splash",
  run: async (client, message) => {
    if (!message.guild) {
      return message.reply({
        embeds: [
          buildErrorEmbed(
            client,
            "Server only",
            "Run this command in a server to see its images.",
          ),
        ],
      });
    }

    return deliver(client, (payload) => message.reply(payload), message.guild);
  },
  interaction: {
    data: {
      name: "servericon",
      type: 1,
      description:
        "Show the server's icon, invite splash, banner, and discovery splash",
    },
    run: async (client, interaction) => {
      if (!interaction.guild) {
        return interaction.reply({
          embeds: [
            buildErrorEmbed(
              client,
              "Server only",
              "Run this command in a server to see its images.",
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      return deliver(
        client,
        (payload) => interaction.editReply(payload),
        interaction.guild,
      );
    },
  },
};
