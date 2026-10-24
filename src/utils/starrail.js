const axios = require("axios");
const data = require("../database/json/starrail.json");

const API_URL = "https://enka.network/api/hsr/uid";
const REQUEST_TIMEOUT = 15_000;
const DEFAULT_TTL = 60_000;
const MAX_TTL = 300_000;
const MAX_CACHE_SIZE = 100;
const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";

const RELIC_SLOTS = {
  1: "Head",
  2: "Hands",
  3: "Body",
  4: "Feet",
  5: "Planar Sphere",
  6: "Link Rope",
};

const STAT_LABELS = {
  HPDelta: "HP",
  HPRatio: "HP%",
  HPAddedRatio: "HP%",
  AttackDelta: "ATK",
  AttackAddedRatio: "ATK%",
  DefenceDelta: "DEF",
  DefenceAddedRatio: "DEF%",
  SpeedDelta: "SPD",
  CriticalChance: "CRIT Rate",
  CriticalChanceBase: "CRIT Rate",
  CriticalDamage: "CRIT DMG",
  CriticalDamageBase: "CRIT DMG",
  StatusProbability: "Effect Hit Rate",
  StatusProbabilityBase: "Effect Hit Rate",
  StatusResistance: "Effect RES",
  StatusResistanceBase: "Effect RES",
  BreakDamageAddedRatio: "Break Effect",
  BreakDamageAddedRatioBase: "Break Effect",
  HealRatioBase: "Outgoing Healing",
  SPRatio: "Energy Regen",
  SPRatioBase: "Energy Regen",
  PhysicalAddedRatio: "Physical DMG",
  FireAddedRatio: "Fire DMG",
  IceAddedRatio: "Ice DMG",
  LightningAddedRatio: "Lightning DMG",
  WindAddedRatio: "Wind DMG",
  QuantumAddedRatio: "Quantum DMG",
  ImaginaryAddedRatio: "Imaginary DMG",
};

const FLAT_STATS = new Set([
  "HPDelta",
  "AttackDelta",
  "DefenceDelta",
  "SpeedDelta",
]);

const cache = new Map();

function normalizeUid(value) {
  const uid = String(value ?? "").trim();

  return /^\d{9}$/.test(uid) ? uid : null;
}

async function fetchProfile(uid) {
  const cached = cache.get(uid);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  const response = await axios.get(`${API_URL}/${uid}`, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const profile = response.data;

  if (!profile?.detailInfo) {
    const error = new Error("Enka.Network returned no profile data");
    error.code = "EMPTY_PROFILE";
    throw error;
  }

  const ttl = Number(profile.ttl) * 1000;
  const expiresAt =
    Date.now() +
    (Number.isFinite(ttl)
      ? Math.min(Math.max(ttl, DEFAULT_TTL), MAX_TTL)
      : DEFAULT_TTL);

  cache.set(uid, { profile, expiresAt });

  if (cache.size > MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value);
  }

  return profile;
}

function formatStat(type, value) {
  const label = STAT_LABELS[type] || type;

  if (FLAT_STATS.has(type)) {
    return { label, value: Math.round(value).toLocaleString("en-US") };
  }

  const percent = (value * 100).toFixed(1).replace(/\.0$/, "");

  return { label, value: `${percent}%` };
}

function lightConeInfo(equipment) {
  if (!equipment?.tid) {
    return null;
  }

  const meta = data.lightCones[String(equipment.tid)] || {};

  return {
    id: String(equipment.tid),
    name: meta.name || `Light cone ${equipment.tid}`,
    superimposition: Number(equipment.rank) || 1,
    level: Number(equipment.level) || null,
    rarity: meta.rarity || null,
    path: meta.path || null,
  };
}

function relicInfo(relic) {
  const meta = data.relics[String(relic?.tid)] || {};
  const main = relic?._flat?.props?.[0];

  if (!main) {
    return null;
  }

  const stat = formatStat(main.type, main.value);

  return {
    id: String(relic.tid),
    set: meta.set ? String(meta.set) : null,
    setName: meta.set
      ? data.relicSets[String(meta.set)]?.name || `Set ${meta.set}`
      : null,
    slot: RELIC_SLOTS[relic.type] || "Relic",
    rarity: meta.rarity || null,
    level: Number(relic.level) || null,
    stat: stat.label,
    value: stat.value,
  };
}

function characterInfo(avatar) {
  const meta = data.characters[String(avatar?.avatarId)] || {};
  const skillTree = new Set(
    (avatar?.skillTreeList || []).map((node) => String(node?.pointId)),
  );
  const eidolon = (meta.ranks || []).filter((rank) =>
    skillTree.has(String(rank)),
  ).length;
  const relicList = Array.isArray(avatar?.relicList) ? avatar.relicList : [];
  const relics = relicList.map(relicInfo).filter(Boolean);
  const setCounts = new Map();

  for (const relic of relics) {
    if (!relic.set) {
      continue;
    }

    setCounts.set(relic.set, (setCounts.get(relic.set) || 0) + 1);
  }

  const relicSets = [...setCounts.entries()]
    .map(([id, count]) => ({
      id,
      name: data.relicSets[id]?.name || `Set ${id}`,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    id: String(avatar?.avatarId ?? ""),
    name: meta.name || `Character ${avatar?.avatarId ?? "unknown"}`,
    rarity: meta.rarity || null,
    level: Number(avatar?.level) || null,
    element: meta.element || null,
    path: meta.path || null,
    eidolon,
    lightCone: lightConeInfo(avatar?.equipment),
    relicCount: relicList.length,
    relicSets,
    relicStats: relics,
    support: avatar?._assist === true,
  };
}

function showcase(profile) {
  const avatars = profile?.detailInfo?.avatarDetailList;

  return Array.isArray(avatars) ? avatars.map(characterInfo) : [];
}

module.exports = {
  fetchProfile,
  normalizeUid,
  showcase,
};
