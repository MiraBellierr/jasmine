const path = require("path");
const axios = require("axios");
const signale = require("signale");

let canvasLib = null;

try {
  canvasLib = require("@napi-rs/canvas");
} catch (error) {
  signale.warn(`Star Rail card rendering is unavailable: ${error.message}`);
}

const { createCanvas, loadImage, GlobalFonts } = canvasLib || {};

const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";
const FONT_FAMILY =
  '"Star Rail", "Segoe UI", "Microsoft YaHei", "Yu Gothic", "SimSun", "Malgun Gothic", "Noto Sans CJK JP", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK KR", "Source Han Sans", "WenQuanYi Micro Hei", sans-serif';
const CJK_TEXT = /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;
const CJK_FONT =
  /^(Microsoft YaHei|SimSun|Yu Gothic|Meiryo|Malgun Gothic|Noto Sans CJK|Source Han Sans|WenQuanYi|PingFang|Hiragino)/i;
const ASSET_TIMEOUT = 15_000;
const MAX_ICON_CACHE = 200;
const MAX_ART_CACHE = 12;
const MAX_CARD_CACHE = 40;
const DEFAULT_CARD_TTL = 60_000;
const MAX_CARD_TTL = 300_000;

const ELEMENT_COLORS = {
  Physical: "#D7D7D7",
  Fire: "#F97316",
  Ice: "#38BDF8",
  Lightning: "#A855F7",
  Wind: "#34D399",
  Quantum: "#818CF8",
  Imaginary: "#FACC15",
};

const ELEMENT_ICON_NAMES = {
  Physical: "Physical",
  Fire: "Fire",
  Ice: "Ice",
  Lightning: "Lightning",
  Wind: "Wind",
  Quantum: "Quantum",
  Imaginary: "Imaginary",
};

const PATH_ICON_NAMES = {
  Destruction: "Destruction",
  "The Hunt": "Hunt",
  Erudition: "Erudition",
  Harmony: "Harmony",
  Nihility: "Nihility",
  Preservation: "Preservation",
  Abundance: "Abundance",
  Remembrance: "Remembrance",
  Elation: "Elation",
};

const REGION_LABELS = {
  NA: "America",
  EU: "Europe",
  ASIA: "Asia",
  CN: "China",
  "TW/HK/MO": "TW/HK/MO",
};

const iconCache = new Map();
const artCache = new Map();
const cardCache = new Map();

let fontsRegistered = false;

function isAvailable() {
  return Boolean(createCanvas && loadImage);
}

function ensureFonts() {
  if (fontsRegistered || !GlobalFonts) {
    return;
  }

  const fontDirectory = path.join(__dirname, "..", "assets", "fonts");

  for (const file of ["NotoSans-Regular.ttf", "NotoSans-Bold.ttf"]) {
    try {
      GlobalFonts.registerFromPath(path.join(fontDirectory, file), "Star Rail");
    } catch (error) {
      signale.warn(
        `Could not load Star Rail card font ${file}: ${error.message}`,
      );
    }
  }

  fontsRegistered = true;
}

function font(size, weight = "normal") {
  return `${weight} ${size}px ${FONT_FAMILY}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number.toLocaleString("en-US") : "0";
}

function withAlpha(hex, alpha) {
  const value = String(hex).replace("#", "");
  const number = Number.parseInt(value, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function hasCjkFont() {
  if (!GlobalFonts?.families) {
    return false;
  }

  return GlobalFonts.families.some((font) => CJK_FONT.test(font.family));
}

function safeName(name) {
  const text = String(name ?? "").trim();

  if (!text) {
    return "TRAILBLAZER";
  }

  if (CJK_TEXT.test(text) && !hasCjkFont()) {
    return "TRAILBLAZER";
  }

  return text;
}

function regionLabel(region) {
  return REGION_LABELS[region] || region || "Unknown";
}

function elementColor(element) {
  return ELEMENT_COLORS[element] || "#8B5CF6";
}

function roundRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillRoundRect(context, x, y, width, height, radius, color) {
  roundRect(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function strokeRoundRect(
  context,
  x,
  y,
  width,
  height,
  radius,
  color,
  widthPx = 1,
) {
  roundRect(context, x, y, width, height, radius);
  context.strokeStyle = color;
  context.lineWidth = widthPx;
  context.stroke();
}

function fitText(context, text, maxWidth) {
  const value = String(text ?? "");

  if (context.measureText(value).width <= maxWidth) {
    return value;
  }

  let low = 0;
  let high = value.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const candidate = `${value.slice(0, middle).trimEnd()}...`;

    if (context.measureText(candidate).width <= maxWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return `${value.slice(0, low).trimEnd()}...`;
}

function drawText(
  context,
  text,
  x,
  y,
  {
    size = 24,
    weight = "normal",
    color = "#FFFFFF",
    align = "left",
    baseline = "middle",
    maxWidth = null,
  } = {},
) {
  context.font = font(size, weight);
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = baseline;
  context.fillText(
    maxWidth ? fitText(context, text, maxWidth) : String(text ?? ""),
    x,
    y,
  );
}

function drawBackground(context, width, height, accent) {
  const base = context.createLinearGradient(0, 0, width, height);

  base.addColorStop(0, "#0B0E17");
  base.addColorStop(0.55, "#101426");
  base.addColorStop(1, "#090B12");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(
    width * 0.12,
    height * 0.04,
    0,
    width * 0.12,
    height * 0.04,
    width * 0.7,
  );

  glow.addColorStop(0, withAlpha(accent, 0.3));
  glow.addColorStop(1, withAlpha(accent, 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const secondGlow = context.createRadialGradient(
    width * 0.92,
    height * 0.92,
    0,
    width * 0.92,
    height * 0.92,
    width * 0.6,
  );

  secondGlow.addColorStop(0, "rgba(59, 130, 246, 0.16)");
  secondGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
  context.fillStyle = secondGlow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255, 255, 255, 0.035)";
  context.lineWidth = 1;

  for (let x = 0; x < width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y < height; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.2,
    width / 2,
    height / 2,
    width * 0.8,
  );

  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

async function fetchAsset(url, large = false) {
  const cache = large ? artCache : iconCache;
  const cached = cache.get(url);

  if (cached) {
    return cached;
  }

  const response = await axios.get(url, {
    timeout: ASSET_TIMEOUT,
    responseType: "arraybuffer",
    headers: {
      Accept: "image/*",
      "User-Agent": USER_AGENT,
    },
  });
  const buffer = Buffer.from(response.data);

  cache.set(url, buffer);

  const limit = large ? MAX_ART_CACHE : MAX_ICON_CACHE;

  if (cache.size > limit) {
    cache.delete(cache.keys().next().value);
  }

  return buffer;
}

async function loadAsset(url, large = false) {
  if (!url) {
    return null;
  }

  try {
    const buffer = await fetchAsset(url, large);

    return await loadImage(buffer);
  } catch (error) {
    signale.warn(
      `Could not load Star Rail card asset ${url}: ${error.message}`,
    );

    return null;
  }
}

function characterIconUrl(id) {
  return `https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/${id}.png`;
}

function fullArtUrl(id) {
  return `https://enka.network/ui/hsr/SpriteOutput/AvatarDrawCard/${id}.png`;
}

function lightConeIconUrl(id) {
  return `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${id}.png`;
}

function elementIconUrl(element) {
  const name = ELEMENT_ICON_NAMES[element];

  return name
    ? `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/element/${name}.png`
    : null;
}

function pathIconUrl(pathName) {
  const name = PATH_ICON_NAMES[pathName];

  return name
    ? `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/path/${name}.png`
    : null;
}

function drawImageCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawIcon(context, image, x, y, size, accent, fallbackText) {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  if (image) {
    drawImageCover(context, image, x, y, size, size);
  } else {
    context.fillStyle = withAlpha(accent, 0.25);
    context.fillRect(x, y, size, size);
    drawText(
      context,
      String(fallbackText ?? "?").slice(0, 1),
      x + size / 2,
      y + size / 2,
      {
        size: size * 0.42,
        weight: "bold",
        color: accent,
        align: "center",
      },
    );
  }

  context.restore();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.strokeStyle = withAlpha(accent, 0.75);
  context.lineWidth = 3;
  context.stroke();
}

function drawPill(context, text, x, y, color, align = "left") {
  context.font = font(14, "bold");
  const width = context.measureText(text).width + 22;
  const left = align === "right" ? x - width : x;

  fillRoundRect(context, left, y - 15, width, 30, 15, withAlpha(color, 0.18));
  drawText(context, text, left + width / 2, y, {
    size: 14,
    weight: "bold",
    color,
    align: "center",
  });
}

function drawStatCard(context, x, y, width, height, value, label, accent) {
  fillRoundRect(context, x, y, width, height, 20, "rgba(255, 255, 255, 0.055)");
  strokeRoundRect(
    context,
    x,
    y,
    width,
    height,
    20,
    "rgba(255, 255, 255, 0.08)",
  );
  fillRoundRect(context, x, y + 20, 4, height - 40, 2, accent);
  drawText(context, value, x + 24, y + height / 2 - 14, {
    size: 34,
    weight: "bold",
    color: "#FFFFFF",
  });
  drawText(context, label, x + 24, y + height / 2 + 22, {
    size: 15,
    weight: "bold",
    color: "rgba(226, 232, 240, 0.62)",
  });
}

function cardTtl(profile) {
  const ttl = Number(profile?.ttl) * 1000;

  return Number.isFinite(ttl)
    ? clamp(ttl, DEFAULT_CARD_TTL, MAX_CARD_TTL)
    : DEFAULT_CARD_TTL;
}

function cachedCard(key) {
  const cached = cardCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    cardCache.delete(key);
  }

  return null;
}

function storeCard(key, value, ttl) {
  cardCache.set(key, { value, expiresAt: Date.now() + ttl });

  if (cardCache.size > MAX_CARD_CACHE) {
    cardCache.delete(cardCache.keys().next().value);
  }
}

async function renderProfileCard(profile, uid, characters) {
  if (!isAvailable()) {
    return null;
  }

  ensureFonts();

  const key = `profile:${uid}`;
  const cached = cachedCard(key);

  if (cached) {
    return cached;
  }

  const width = 1200;
  const padding = 64;
  const gap = 24;
  const tileWidth = (width - padding * 2 - gap) / 2;
  const tileHeight = 200;
  const gridTop = 574;
  const visibleCharacters = characters.slice(0, 8);
  const rows = Math.ceil(visibleCharacters.length / 2);
  const contentBottom = visibleCharacters.length
    ? gridTop + rows * (tileHeight + gap) - gap
    : gridTop + 380;
  const footerLineY = contentBottom + 64;
  const footerTextY = footerLineY + 42;
  const height = footerTextY + 56;
  const accent = "#8B5CF6";
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const info = profile?.detailInfo || {};
  const record = info.recordInfo || {};
  const region = regionLabel(profile?.region);
  const headIcon = info.headIcon
    ? await loadAsset(characterIconUrl(info.headIcon))
    : null;
  const icons = await Promise.all(
    visibleCharacters.map((character) =>
      loadAsset(characterIconUrl(character.id)),
    ),
  );

  drawBackground(context, width, height, accent);

  drawText(context, "HONKAI: STAR RAIL", padding, 72, {
    size: 22,
    weight: "bold",
    color: withAlpha(accent, 0.95),
  });
  drawText(context, "TRAILBLAZER PROFILE", padding, 132, {
    size: 54,
    weight: "bold",
    color: "#FFFFFF",
  });
  drawText(context, "ENKA.NETWORK", width - padding, 72, {
    size: 18,
    weight: "bold",
    color: "rgba(226, 232, 240, 0.5)",
    align: "right",
  });
  fillRoundRect(
    context,
    width - padding - 168,
    96,
    168,
    2,
    1,
    withAlpha(accent, 0.6),
  );

  drawIcon(context, headIcon, padding, 180, 150, accent, "T");

  drawText(context, safeName(info.nickname), padding + 184, 222, {
    size: 44,
    weight: "bold",
    color: "#FFFFFF",
    maxWidth: 760,
  });
  drawText(context, `UID ${uid}  /  ${region}`, padding + 184, 268, {
    size: 24,
    color: "rgba(226, 232, 240, 0.66)",
  });
  drawText(
    context,
    `Level ${info.level ?? "?"}  /  World ${info.worldLevel ?? "?"}`,
    padding + 184,
    308,
    {
      size: 24,
      color: "rgba(226, 232, 240, 0.66)",
    },
  );

  const stats = [
    ["Achievements", record.achievementCount],
    ["Characters", record.avatarCount],
    ["Light cones", record.equipmentCount],
    ["Relics", record.relicCount],
  ];
  const statWidth = (width - padding * 2 - 60) / 4;

  stats.forEach(([label, value], index) => {
    drawStatCard(
      context,
      padding + index * (statWidth + 20),
      366,
      statWidth,
      104,
      formatNumber(value),
      label,
      accent,
    );
  });

  drawText(context, "CHARACTER SHOWCASE", padding, 536, {
    size: 24,
    weight: "bold",
    color: "#FFFFFF",
  });
  drawText(context, `${visibleCharacters.length} / 8`, width - padding, 536, {
    size: 20,
    weight: "bold",
    color: "rgba(226, 232, 240, 0.5)",
    align: "right",
  });

  if (!visibleCharacters.length) {
    fillRoundRect(
      context,
      padding,
      572,
      width - padding * 2,
      380,
      28,
      "rgba(255, 255, 255, 0.04)",
    );
    strokeRoundRect(
      context,
      padding,
      572,
      width - padding * 2,
      380,
      28,
      "rgba(255, 255, 255, 0.08)",
    );
    drawText(context, "No public characters", width / 2, 735, {
      size: 36,
      weight: "bold",
      color: "rgba(226, 232, 240, 0.8)",
      align: "center",
    });
    drawText(
      context,
      "The player has not set a public character showcase.",
      width / 2,
      782,
      {
        size: 22,
        color: "rgba(226, 232, 240, 0.5)",
        align: "center",
      },
    );
  } else {
    visibleCharacters.forEach((character, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = padding + column * (tileWidth + gap);
      const y = gridTop + row * (tileHeight + gap);
      const elementColor = ELEMENT_COLORS[character.element] || accent;

      fillRoundRect(
        context,
        x,
        y,
        tileWidth,
        tileHeight,
        24,
        "rgba(255, 255, 255, 0.055)",
      );
      strokeRoundRect(
        context,
        x,
        y,
        tileWidth,
        tileHeight,
        24,
        "rgba(255, 255, 255, 0.08)",
      );
      fillRoundRect(context, x, y + 24, 3, tileHeight - 48, 2, elementColor);
      drawIcon(
        context,
        icons[index],
        x + 24,
        y + 46,
        108,
        elementColor,
        character.name,
      );

      drawText(context, character.name, x + 156, y + 48, {
        size: 27,
        weight: "bold",
        color: "#FFFFFF",
        maxWidth: tileWidth - 190,
      });
      drawText(
        context,
        `Lv. ${character.level ?? "?"}${character.eidolon ? `  /  E${character.eidolon}` : ""}`,
        x + 156,
        y + 84,
        {
          size: 20,
          color: "rgba(226, 232, 240, 0.72)",
        },
      );
      drawText(
        context,
        [character.element, character.path].filter(Boolean).join("  /  "),
        x + 156,
        y + 116,
        {
          size: 20,
          color: elementColor,
          maxWidth: tileWidth - 190,
        },
      );

      const lightCone = character.lightCone
        ? `${character.lightCone.name}  S${character.lightCone.superimposition}`
        : "No light cone";

      drawText(context, lightCone, x + 156, y + 152, {
        size: 17,
        color: "rgba(226, 232, 240, 0.52)",
        maxWidth: tileWidth - 190,
      });

      if (character.support) {
        drawPill(
          context,
          "SUPPORT",
          x + tileWidth - 24,
          y + 28,
          "#34D399",
          "right",
        );
      }
    });
  }

  fillRoundRect(
    context,
    padding,
    footerLineY,
    width - padding * 2,
    1,
    0.5,
    "rgba(255, 255, 255, 0.08)",
  );
  drawText(context, "Data from Enka.Network", padding, footerTextY, {
    size: 17,
    color: "rgba(226, 232, 240, 0.42)",
  });
  drawText(context, `UID ${uid}`, width - padding, footerTextY, {
    size: 17,
    color: "rgba(226, 232, 240, 0.42)",
    align: "right",
  });

  const result = { buffer: canvas.toBuffer("image/png"), extension: "png" };

  storeCard(key, result, cardTtl(profile));

  return result;
}

async function renderCharacterCard(profile, uid, character) {
  if (!isAvailable()) {
    return null;
  }

  ensureFonts();

  const key = `character:${uid}:${character.id}`;
  const cached = cachedCard(key);

  if (cached) {
    return cached;
  }

  const width = 1200;
  const height = 900;
  const artWidth = 600;
  const panelX = 640;
  const panelWidth = width - panelX - 64;
  const statGap = 24;
  const statWidth = (panelWidth - statGap) / 2;
  const accent = ELEMENT_COLORS[character.element] || "#8B5CF6";
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const [art, icon, lightConeIcon, elementIcon, pathIcon] = await Promise.all([
    loadAsset(fullArtUrl(character.id), true),
    loadAsset(characterIconUrl(character.id)),
    character.lightCone
      ? loadAsset(lightConeIconUrl(character.lightCone.id))
      : null,
    character.element ? loadAsset(elementIconUrl(character.element)) : null,
    character.path ? loadAsset(pathIconUrl(character.path)) : null,
  ]);

  drawBackground(context, width, height, accent);

  if (art) {
    const artCanvas = createCanvas(artWidth, height);
    const artContext = artCanvas.getContext("2d");
    const artCropWidth = Math.min(art.width, art.height * (artWidth / height));
    const artCropX = (art.width - artCropWidth) / 2;

    artContext.drawImage(
      art,
      artCropX,
      0,
      artCropWidth,
      art.height,
      0,
      0,
      artWidth,
      height,
    );

    const fadeStart = artWidth - 220;
    const fade = artContext.createLinearGradient(fadeStart, 0, artWidth, 0);

    fade.addColorStop(0, "rgba(0, 0, 0, 0)");
    fade.addColorStop(1, "rgba(0, 0, 0, 1)");
    artContext.globalCompositeOperation = "destination-out";
    artContext.fillStyle = fade;
    artContext.fillRect(fadeStart, 0, artWidth - fadeStart, height);
    artContext.globalCompositeOperation = "source-over";

    context.drawImage(artCanvas, 0, 0);
  } else if (icon) {
    drawIcon(context, icon, 150, 250, 300, accent, character.name);
  }

  fillRoundRect(
    context,
    artWidth - 1,
    80,
    2,
    height - 160,
    1,
    withAlpha(accent, 0.45),
  );

  drawText(context, "CHARACTER CARD", panelX, 72, {
    size: 18,
    weight: "bold",
    color: withAlpha(accent, 0.9),
  });

  if (character.support) {
    drawPill(context, "SUPPORT", width - 64, 72, "#34D399", "right");
  }

  drawText(context, character.name, panelX, 140, {
    size: 50,
    weight: "bold",
    color: "#FFFFFF",
    maxWidth: panelWidth,
  });

  const rarityColor = character.rarity === 5 ? "#FACC15" : "#C084FC";

  drawText(context, `${character.rarity ?? "?"} STAR`, panelX, 187, {
    size: 21,
    weight: "bold",
    color: rarityColor,
  });
  drawText(
    context,
    `Lv. ${character.level ?? "?"}  /  E${character.eidolon}`,
    panelX + 108,
    187,
    {
      size: 21,
      color: "rgba(226, 232, 240, 0.7)",
    },
  );

  let cursorX = panelX;

  if (elementIcon) {
    context.drawImage(elementIcon, cursorX, 215, 28, 28);
    cursorX += 36;
  }

  drawText(context, character.element || "Unknown element", cursorX, 230, {
    size: 20,
    color: accent,
  });
  cursorX +=
    context.measureText(character.element || "Unknown element").width + 28;

  if (pathIcon) {
    context.drawImage(pathIcon, cursorX, 215, 28, 28);
    cursorX += 36;
  }

  drawText(context, character.path || "Unknown path", cursorX, 230, {
    size: 20,
    color: "rgba(226, 232, 240, 0.72)",
  });

  fillRoundRect(
    context,
    panelX,
    270,
    panelWidth,
    1,
    0.5,
    "rgba(255, 255, 255, 0.1)",
  );

  drawText(context, "LIGHT CONE", panelX, 306, {
    size: 15,
    weight: "bold",
    color: "rgba(226, 232, 240, 0.48)",
  });

  if (character.lightCone) {
    if (lightConeIcon) {
      context.save();
      roundRect(context, panelX, 328, 80, 80, 16);
      context.clip();
      drawImageCover(context, lightConeIcon, panelX, 328, 80, 80);
      context.restore();
      strokeRoundRect(context, panelX, 328, 80, 80, 16, withAlpha(accent, 0.4));
    }

    drawText(context, character.lightCone.name, panelX + 100, 352, {
      size: 23,
      weight: "bold",
      color: "#FFFFFF",
      maxWidth: panelWidth - 100,
    });
    drawText(
      context,
      `S${character.lightCone.superimposition}  /  Lv. ${character.lightCone.level ?? "?"}`,
      panelX + 100,
      384,
      {
        size: 19,
        color: "rgba(226, 232, 240, 0.62)",
      },
    );
  } else {
    drawText(context, "No light cone equipped", panelX, 358, {
      size: 22,
      color: "rgba(226, 232, 240, 0.52)",
    });
  }

  fillRoundRect(
    context,
    panelX,
    432,
    panelWidth,
    1,
    0.5,
    "rgba(255, 255, 255, 0.1)",
  );

  drawText(context, "RELIC SETS", panelX, 468, {
    size: 15,
    weight: "bold",
    color: "rgba(226, 232, 240, 0.48)",
  });

  if (character.relicSets.length) {
    character.relicSets.slice(0, 3).forEach((set, index) => {
      drawText(
        context,
        `${set.count}x  ${set.name}`,
        panelX,
        502 + index * 30,
        {
          size: 20,
          color: index === 0 ? "#FFFFFF" : "rgba(226, 232, 240, 0.72)",
          maxWidth: panelWidth,
        },
      );
    });
  } else {
    drawText(context, "No relics equipped", panelX, 504, {
      size: 20,
      color: "rgba(226, 232, 240, 0.52)",
    });
  }

  if (character.relicStats.length) {
    fillRoundRect(
      context,
      panelX,
      616,
      panelWidth,
      1,
      0.5,
      "rgba(255, 255, 255, 0.1)",
    );

    drawText(context, "MAIN STATS", panelX, 650, {
      size: 15,
      weight: "bold",
      color: "rgba(226, 232, 240, 0.48)",
    });

    character.relicStats.slice(0, 6).forEach((stat, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = panelX + column * (statWidth + statGap);
      const y = 684 + row * 52;

      drawText(context, stat.slot.toUpperCase(), x, y, {
        size: 13,
        weight: "bold",
        color: "rgba(226, 232, 240, 0.42)",
      });
      drawText(context, `${stat.stat}  ${stat.value}`, x, y + 23, {
        size: 20,
        weight: "bold",
        color: "#FFFFFF",
        maxWidth: statWidth,
      });
    });
  }

  drawText(context, `UID ${uid}  /  Enka.Network`, panelX, 858, {
    size: 16,
    color: "rgba(226, 232, 240, 0.38)",
  });

  const result = {
    buffer: canvas.toBuffer("image/jpeg", 92),
    extension: "jpg",
  };

  storeCard(key, result, cardTtl(profile));

  return result;
}

async function renderFullArt(uid, character) {
  if (!isAvailable()) {
    return null;
  }

  ensureFonts();

  const key = `art:${uid}:${character.id}`;
  const cached = cachedCard(key);

  if (cached) {
    return cached;
  }

  const width = 1200;
  const height = 1500;
  const accent = ELEMENT_COLORS[character.element] || "#8B5CF6";
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const art = await loadAsset(fullArtUrl(character.id), true);

  if (!art) {
    return null;
  }

  drawBackground(context, width, height, accent);

  const artSize = 1080;
  const artX = (width - artSize) / 2;
  const artY = 80;

  context.save();
  context.shadowColor = withAlpha(accent, 0.55);
  context.shadowBlur = 90;
  context.drawImage(art, artX, artY, artSize, artSize);
  context.restore();

  drawText(context, "FULL ART", 64, 1250, {
    size: 18,
    weight: "bold",
    color: withAlpha(accent, 0.9),
  });
  drawText(context, character.name, 64, 1310, {
    size: 50,
    weight: "bold",
    color: "#FFFFFF",
    maxWidth: 1072,
  });
  drawText(
    context,
    [character.element, character.path].filter(Boolean).join("  /  "),
    64,
    1358,
    {
      size: 23,
      color: "rgba(226, 232, 240, 0.7)",
    },
  );
  drawText(context, `UID ${uid}  /  Enka.Network`, width - 64, 1438, {
    size: 16,
    color: "rgba(226, 232, 240, 0.38)",
    align: "right",
  });

  const result = {
    buffer: canvas.toBuffer("image/jpeg", 92),
    extension: "jpg",
  };

  storeCard(key, result, cardTtl(null));

  return result;
}

module.exports = {
  characterIconUrl,
  elementColor,
  isAvailable,
  renderCharacterCard,
  renderFullArt,
  renderProfileCard,
};
