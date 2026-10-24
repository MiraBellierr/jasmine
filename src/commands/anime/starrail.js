const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  escapeMarkdown,
  inlineCode,
} = require("discord.js");
const signale = require("signale");
const {
  fetchProfile,
  normalizeUid,
  showcase,
} = require("../../utils/starrail");
const {
  characterIconUrl,
  elementColor,
  isAvailable,
  renderCharacterCard,
  renderFullArt,
  renderProfileCard,
} = require("../../utils/starrailCard");
const { slashCommand, textOption } = require("../../utils/slashCommands");

const BRAND_COLOR = "#7C3AED";
const ERROR_COLOR = "#EF4444";
const VIEW_TIMEOUT = 180_000;
const MAX_TITLE = 256;
const MAX_INPUT = 50;
const MAX_SIGNATURE = 500;
const MAX_LINE = 120;
const MAX_FIELD = 1024;
const MAX_SHOWCASE = 8;

const SELECT_ID = "starrail:character";
const OVERVIEW_ID = "starrail:overview";
const ART_ID = "starrail:art";

const VIEW_PROFILE = "profile";
const VIEW_CHARACTER = "character";
const VIEW_ART = "art";

const REGION_LABELS = {
  NA: "America",
  EU: "Europe",
  ASIA: "Asia",
  CN: "China",
  "TW/HK/MO": "TW/HK/MO",
};

const truncate = (value, max) => {
  const text = String(value ?? "");

  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

const clean = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const formatNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number.toLocaleString("en-US") : "0";
};

const regionLabel = (region) => REGION_LABELS[region] || region || "Unknown";

function currentCharacter(state) {
  return (
    state.characters.find((character) => character.id === state.selectedId) ||
    null
  );
}

function characterSummary(character) {
  return [
    character.level ? `Lv. ${character.level}` : null,
    `E${character.eidolon ?? 0}`,
    character.rarity ? `${character.rarity}-star` : null,
    character.element,
    character.path,
  ]
    .filter(Boolean)
    .join(" • ");
}

function optionSummary(character) {
  return [
    character.level ? `Lv. ${character.level}` : null,
    character.element,
    character.path,
  ]
    .filter(Boolean)
    .join(" • ");
}

function formatCharacter(character) {
  const heading = [`**${escapeMarkdown(character.name)}**`];
  const details = [];

  if (character.level) {
    heading.push(`Lv. ${character.level}`);
  }

  if (character.eidolon) {
    heading.push(`E${character.eidolon}`);
  }

  if (character.element) {
    heading.push(character.element);
  }

  if (character.path) {
    heading.push(character.path);
  }

  if (character.lightCone) {
    details.push(
      `${escapeMarkdown(character.lightCone.name)} S${character.lightCone.superimposition}`,
    );
  }

  if (character.relicCount) {
    details.push(`${character.relicCount} relics`);
  }

  if (character.support) {
    details.push("Support");
  }

  const lines = [truncate(heading.join(" • "), MAX_LINE)];

  if (details.length) {
    lines.push(truncate(`-# ${details.join(" • ")}`, MAX_LINE));
  }

  return lines.join("\n");
}

function formatShowcase(characters) {
  const lines = [];
  let shown = 0;

  for (const character of characters.slice(0, MAX_SHOWCASE)) {
    const remaining = characters.length - shown - 1;
    const suffix = remaining > 0 ? `\n+${remaining} more` : "";
    const block = formatCharacter(character);
    const next = [...lines, block].join("\n");

    if (next.length + suffix.length > MAX_FIELD) {
      break;
    }

    lines.push(block);
    shown += 1;
  }

  const remaining = characters.length - shown;

  if (remaining > 0 && lines.length) {
    lines.push(`+${remaining} more`);
  }

  return lines.join("\n");
}

function buildProfileEmbed(client, state, rendered) {
  const info = state.profile.detailInfo || {};
  const record = info.recordInfo || {};
  const nickname = clean(info.nickname) || `Trailblazer ${state.uid}`;
  const signature = truncate(
    escapeMarkdown(clean(info.signature)),
    MAX_SIGNATURE,
  );
  const region = regionLabel(state.profile.region);
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Honkai: Star Rail",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(BRAND_COLOR)
    .setTitle(truncate(escapeMarkdown(nickname), MAX_TITLE))
    .setFooter({
      text: `UID ${state.uid} • ${region} • Enka.Network`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (signature) {
    embed.setDescription(`> ${signature}`);
  }

  if (rendered) {
    embed.setImage(`attachment://${rendered.name}`);

    return embed;
  }

  const profileValue =
    [
      info.level ? `Level ${info.level}` : null,
      info.worldLevel ? `World ${info.worldLevel}` : null,
      record.achievementCount !== undefined
        ? `${formatNumber(record.achievementCount)} achievements`
        : null,
    ]
      .filter(Boolean)
      .join(" • ") || "No profile data.";

  const collectionValue =
    [
      record.avatarCount !== undefined
        ? `${formatNumber(record.avatarCount)} characters`
        : null,
      record.equipmentCount !== undefined
        ? `${formatNumber(record.equipmentCount)} light cones`
        : null,
      record.relicCount !== undefined
        ? `${formatNumber(record.relicCount)} relics`
        : null,
    ]
      .filter(Boolean)
      .join(" • ") || "No collection data.";

  const showcaseValue = state.characters.length
    ? formatShowcase(state.characters)
    : info.privacySettingInfo?.displayCollection === false
      ? "This player's showcase is private."
      : "No characters in the showcase.";

  embed
    .setThumbnail(
      info.headIcon
        ? characterIconUrl(info.headIcon)
        : client.user.displayAvatarURL(),
    )
    .addFields(
      { name: "Profile", value: profileValue },
      { name: "Collection", value: collectionValue },
      { name: "Showcase", value: showcaseValue },
    );

  return embed;
}

function buildCharacterEmbed(client, state, character, rendered) {
  const index = state.characters.findIndex((item) => item.id === character.id);
  const description = [
    characterSummary(character),
    character.support ? "Support character" : null,
  ]
    .filter(Boolean)
    .join("\n");
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Honkai: Star Rail",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(elementColor(character.element))
    .setTitle(truncate(escapeMarkdown(character.name), MAX_TITLE))
    .setDescription(description || "Character details")
    .setFooter({
      text: `${index + 1} of ${state.characters.length} • UID ${state.uid} • Enka.Network`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (rendered) {
    embed.setImage(`attachment://${rendered.name}`);

    return embed;
  }

  const lightConeValue = character.lightCone
    ? [
        escapeMarkdown(character.lightCone.name),
        `S${character.lightCone.superimposition} • Lv. ${character.lightCone.level ?? "?"}`,
      ].join("\n")
    : "No light cone equipped.";
  const relicSetValue = character.relicSets.length
    ? character.relicSets
        .map((set) => `${set.count}x ${escapeMarkdown(set.name)}`)
        .join("\n")
    : "No relics equipped.";
  const mainStatValue = character.relicStats.length
    ? character.relicStats
        .map((stat) => `${stat.slot}: ${stat.stat} ${stat.value}`)
        .join("\n")
    : "No main stats available.";

  embed
    .setThumbnail(characterIconUrl(character.id))
    .addFields(
      { name: "Light cone", value: lightConeValue, inline: true },
      { name: "Relic sets", value: relicSetValue, inline: true },
      { name: "Main stats", value: mainStatValue },
    );

  return embed;
}

function buildArtEmbed(client, state, character, rendered) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Full art",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(elementColor(character.element))
    .setTitle(truncate(escapeMarkdown(character.name), MAX_TITLE))
    .setFooter({
      text: `UID ${state.uid} • Enka.Network`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (rendered) {
    embed.setImage(`attachment://${rendered.name}`);
  }

  return embed;
}

function buildEmbed(client, state, rendered) {
  if (state.view === VIEW_ART) {
    const character = currentCharacter(state);

    if (character) {
      return buildArtEmbed(client, state, character, rendered);
    }
  }

  if (state.view === VIEW_CHARACTER) {
    const character = currentCharacter(state);

    if (character) {
      return buildCharacterEmbed(client, state, character, rendered);
    }
  }

  return buildProfileEmbed(client, state, rendered);
}

function buildComponents(state, disabled = false) {
  const rows = [];

  if (state.characters.length) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(SELECT_ID)
      .setPlaceholder("Choose a character")
      .setDisabled(disabled);

    menu.addOptions(
      state.characters.map((character) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(truncate(character.name, 100))
          .setDescription(
            truncate(optionSummary(character) || "Open build", 100),
          )
          .setValue(character.id);

        if (
          !disabled &&
          state.view !== VIEW_PROFILE &&
          character.id === state.selectedId
        ) {
          option.setDefault(true);
        }

        return option;
      }),
    );

    rows.push(new ActionRowBuilder().addComponents(menu));
  }

  const character = currentCharacter(state);
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(OVERVIEW_ID)
      .setLabel("Overview")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || state.view === VIEW_PROFILE),
    new ButtonBuilder()
      .setCustomId(ART_ID)
      .setLabel(state.view === VIEW_ART ? "Character card" : "Full art")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || !character || !isAvailable()),
    new ButtonBuilder()
      .setLabel("View on Enka")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://enka.network/hsr/${state.uid}/`),
  );

  rows.push(buttons);

  return rows;
}

function buildPayload(client, state, rendered) {
  const payload = {
    embeds: [buildEmbed(client, state, rendered)],
    components: buildComponents(state),
  };

  if (rendered) {
    payload.files = [
      new AttachmentBuilder(rendered.buffer, { name: rendered.name }),
    ];
  }

  return payload;
}

function buildUsageEmbed(client, { prefix, input, slash = false }) {
  const invalid = Boolean(input);
  const shown = truncate(input, MAX_INPUT).replace(/`/g, "'");
  const description = invalid
    ? `${inlineCode(shown)} is not a valid UID. Use the 9-digit UID from your in-game profile.`
    : "Enter a player's 9-digit UID to see their profile card. Then pick a character to see their build or full art.";

  return new EmbedBuilder()
    .setAuthor({
      name: "Honkai: Star Rail",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(invalid ? ERROR_COLOR : BRAND_COLOR)
    .setTitle(invalid ? "Invalid UID" : "Star Rail profile")
    .setDescription(description)
    .addFields(
      {
        name: "Usage",
        value: slash
          ? "`/starrail uid:<uid>`"
          : `\`${prefix}starrail <uid>\`\n\`/starrail uid:<uid>\``,
      },
      {
        name: "Example",
        value: slash
          ? "`/starrail uid:700649319`"
          : `\`${prefix}starrail 700649319\``,
      },
    )
    .setFooter({
      text: "Find your UID in your in-game profile.",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();
}

function buildErrorEmbed(client, error, uid) {
  const status = error.response?.status;
  const code = error.code;
  let title = "Profile unavailable";
  let description = "Enka.Network did not return this profile. Try again.";

  if (status === 404) {
    title = "Player not found";
    description = `No player has UID ${inlineCode(uid)}. Check the UID and try again.`;
  } else if (status === 400) {
    title = "Invalid UID";
    description = `Enka.Network says UID ${inlineCode(uid)} is invalid. Check the UID and try again.`;
  } else if (status === 429) {
    title = "Too many requests";
    description =
      "Enka.Network is limiting requests right now. Try again in a minute.";
  } else if (code === "EMPTY_PROFILE") {
    title = "No profile data";
    description = `Enka.Network has no public data for UID ${inlineCode(uid)}.`;
  } else if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    title = "Request timed out";
    description = "Enka.Network did not respond in time. Try again.";
  } else if (status >= 500) {
    title = "Enka.Network error";
    description = "Enka.Network could not load this profile. Try again later.";
  }

  return new EmbedBuilder()
    .setAuthor({
      name: "Honkai: Star Rail",
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function viewFileName(state, extension) {
  if (state.view === VIEW_PROFILE) {
    return `starrail-profile-${state.uid}.${extension}`;
  }

  const character = currentCharacter(state);
  const suffix = state.view === VIEW_ART ? "art" : "card";

  return `starrail-${state.uid}-${character?.id ?? "character"}-${suffix}.${extension}`;
}

async function safeRender(state) {
  try {
    let rendered;

    if (state.view === VIEW_ART) {
      const character = currentCharacter(state);

      if (!character) {
        return null;
      }

      rendered = await renderFullArt(state.uid, character);
    } else if (state.view === VIEW_CHARACTER) {
      const character = currentCharacter(state);

      if (!character) {
        return null;
      }

      rendered = await renderCharacterCard(state.profile, state.uid, character);
    } else {
      rendered = await renderProfileCard(
        state.profile,
        state.uid,
        state.characters,
      );
    }

    if (!rendered?.buffer) {
      return null;
    }

    return {
      ...rendered,
      name: viewFileName(state, rendered.extension || "png"),
    };
  } catch (error) {
    signale.warn(
      `Star Rail card render failed for ${state.uid} (${state.view}): ${error.message}`,
    );

    return null;
  }
}

async function updateView(client, interaction, state, { view, selectedId }) {
  const previous = { view: state.view, selectedId: state.selectedId };

  if (selectedId !== undefined) {
    state.selectedId = selectedId;
  }

  state.view = view;

  const rendered = await safeRender(state);

  if (view === VIEW_ART && !rendered) {
    state.view = previous.view;
    state.selectedId = previous.selectedId;

    await interaction
      .followUp({
        content: "This character has no full art.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return;
  }

  await interaction.editReply({
    ...buildPayload(client, state, rendered),
    attachments: [],
  });
}

function attachViewer(client, message, state, { ownerId, commandLabel }) {
  let queue = Promise.resolve();

  const collector = message.createMessageComponentCollector({
    time: VIEW_TIMEOUT,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction
        .reply({
          content: `Only the person who ran the command can use the menu and buttons. Run ${commandLabel} to view your own profile.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return;
    }

    const isSelect =
      interaction.isStringSelectMenu() && interaction.customId === SELECT_ID;
    const isButton =
      interaction.isButton() &&
      [OVERVIEW_ID, ART_ID].includes(interaction.customId);

    if (!isSelect && !isButton) {
      return;
    }

    try {
      await interaction.deferUpdate();
    } catch {
      return;
    }

    queue = queue
      .then(async () => {
        if (isSelect) {
          const character = state.characters.find(
            (item) => item.id === interaction.values[0],
          );

          if (!character) {
            await interaction
              .followUp({
                content: "That character is not in this showcase.",
                flags: MessageFlags.Ephemeral,
              })
              .catch(() => null);
            return;
          }

          await updateView(client, interaction, state, {
            view: VIEW_CHARACTER,
            selectedId: character.id,
          });
          return;
        }

        if (interaction.customId === OVERVIEW_ID) {
          await updateView(client, interaction, state, {
            view: VIEW_PROFILE,
          });
          return;
        }

        if (!currentCharacter(state)) {
          await interaction
            .followUp({
              content: "Choose a character first.",
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => null);
          return;
        }

        await updateView(client, interaction, state, {
          view: state.view === VIEW_ART ? VIEW_CHARACTER : VIEW_ART,
        });
      })
      .catch(async (error) => {
        signale.warn(
          `Star Rail view update failed for ${state.uid}: ${error.message}`,
        );

        await interaction
          .followUp({
            content: "Could not open that view. Try again.",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => null);
      });
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "messageDelete") {
      return;
    }

    try {
      await message.edit({ components: buildComponents(state, true) });
    } catch {
      // The message is gone, or the bot cannot edit it anymore.
    }
  });

  return collector;
}

async function deliver(client, send, { uid, ownerId, commandLabel }) {
  let profile;

  try {
    profile = await fetchProfile(uid);
  } catch (error) {
    signale.warn(
      `Star Rail lookup failed for ${uid} (${error.response?.status ?? error.code ?? "unknown"}): ${error.message}`,
    );

    return send({ embeds: [buildErrorEmbed(client, error, uid)] });
  }

  const characters = showcase(profile);
  const state = {
    profile,
    uid,
    characters,
    selectedId: null,
    view: VIEW_PROFILE,
  };
  const rendered = await safeRender(state);
  const sent = await send(buildPayload(client, state, rendered));

  if (characters.length && sent?.createMessageComponentCollector) {
    attachViewer(client, sent, state, { ownerId, commandLabel });
  }

  return sent;
}

module.exports = {
  name: "starrail",
  aliases: ["hsr"],
  category: "anime",
  description: "Show a player's Star Rail profile and character cards",
  usage: "<uid>",
  run: async (client, message, args) => {
    const prefix =
      (message.guild && client.prefixes.get(message.guild.id)) ||
      process.env.PREFIX ||
      "!";
    const input = args.join(" ").trim();

    if (!input) {
      return message.reply({
        embeds: [buildUsageEmbed(client, { prefix })],
      });
    }

    const uid = normalizeUid(input);

    if (!uid) {
      return message.reply({
        embeds: [buildUsageEmbed(client, { prefix, input })],
      });
    }

    const loading = await message.reply("*Loading profile...*");

    return deliver(client, (payload) => loading.edit(payload), {
      uid,
      ownerId: message.author.id,
      commandLabel: `\`${prefix}starrail\``,
    });
  },
  interaction: {
    data: slashCommand(
      "starrail",
      "Show a player's Star Rail profile and character cards",
      (builder) =>
        builder.addStringOption((option) =>
          textOption(option, "uid", "Player UID (9 digits)"),
        ),
    ),
    run: async (client, interaction) => {
      const input = (interaction.options.getString("uid", true) ?? "").trim();
      const uid = normalizeUid(input);

      if (!uid) {
        return interaction.reply({
          embeds: [buildUsageEmbed(client, { input, slash: true })],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      return deliver(client, (payload) => interaction.editReply(payload), {
        uid,
        ownerId: interaction.user.id,
        commandLabel: "`/starrail`",
      });
    },
  },
};
