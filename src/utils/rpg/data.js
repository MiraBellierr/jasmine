const equipments = require("../../database/json/equipments.json");
const characters = require("../../database/json/characters.json");
const constants = require("../constants");
const { STAT_LABELS } = require("./ui");

const CATEGORIES = [
  {
    key: "weapons",
    label: "Weapons",
    singular: "weapon",
    fieldLabel: "Weapon",
    emoji: constants.assets.weapon.emoji,
  },
  {
    key: "shields",
    label: "Shields",
    singular: "shield",
    fieldLabel: "Shield",
    emoji: constants.assets.shield.emoji,
  },
  {
    key: "helmet",
    label: "Helmets",
    singular: "helmet",
    fieldLabel: "Helmet",
    emoji: constants.assets.helmet.emoji,
  },
  {
    key: "armor",
    label: "Armor",
    singular: "armor",
    fieldLabel: "Armor",
    emoji: constants.assets.armor.emoji,
  },
  {
    key: "gloves",
    label: "Gloves",
    singular: "gloves",
    fieldLabel: "Gloves",
    emoji: constants.assets.gloves.emoji,
  },
];

const CATEGORY_KEYS = CATEGORIES.map((category) => category.key);

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeEquipments = (value) => {
  const raw = parseJson(value, {});
  const result = {};

  for (const key of CATEGORY_KEYS) {
    const category = raw?.[key] || {};

    result[key] = {
      equipped: typeof category.equipped === "string" ? category.equipped : "",
      inventory: Array.isArray(category.inventory)
        ? category.inventory.filter((item) => typeof item === "string")
        : [],
    };
  }

  return result;
};

const parseImages = (value) => {
  const images = parseJson(value, []);

  if (!Array.isArray(images)) {
    return [];
  }

  return [...new Set(images.filter((id) => characters[id]))].map(String);
};

const characterImage = (character) => characters[character?.img]?.image || null;

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const equipmentLabel = (key) => {
  const text = String(key || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const findEquipment = (name) => {
  const target = normalizeName(name);

  if (!target) {
    return null;
  }

  for (const category of CATEGORIES) {
    for (const [key, item] of Object.entries(equipments[category.key])) {
      if (normalizeName(key) === target) {
        return { category: category.key, categoryInfo: category, key, item };
      }
    }
  }

  return null;
};

const shopCategories = (playerClass, playerEquipments) => {
  const normalized = normalizeEquipments(playerEquipments);

  return CATEGORIES.map((category) => ({
    ...category,
    items: Object.entries(equipments[category.key])
      .filter(
        ([key, item]) =>
          item.classes.includes(playerClass) &&
          !normalized[category.key].inventory.includes(key),
      )
      .sort((a, b) => a[1].cost - b[1].cost)
      .map(([key, item]) => ({ key, item })),
  }));
};

const inventoryCategories = (playerEquipments) => {
  const normalized = normalizeEquipments(playerEquipments);

  return CATEGORIES.map((category) => ({
    ...category,
    equipped: normalized[category.key].equipped,
    items: normalized[category.key].inventory
      .filter((key) => equipments[category.key][key])
      .map((key) => ({ key, item: equipments[category.key][key] })),
  }));
};

const passiveText = (passive) => {
  if (!passive) {
    return null;
  }

  const changes = Object.entries(passive)
    .filter(([key]) => !["rate", "action", "description"].includes(key))
    .map(([key, value]) => {
      const label = STAT_LABELS[key] || key;
      const amount = Number(value);

      return `${label} ${amount > 0 ? "+" : ""}${amount}`;
    })
    .join(", ");

  if (!changes) {
    return null;
  }

  if (passive.action === "deduce") {
    return `${passive.rate}% chance: opponent's ${changes}`;
  }

  return `${passive.rate}% chance: ${changes}`;
};

const describeEquipment = (item) => {
  const stats = Object.entries(item?.attr || {})
    .map(([key, value]) => {
      const label = STAT_LABELS[key] || key;
      return `${label} +${Number(value)}`;
    })
    .join(", ");
  const parts = [stats];

  if (item?.weight) {
    parts.push(`Weight ${Number(item.weight)}`);
  }

  const passive = passiveText(item?.passive);

  if (passive) {
    parts.push(passive);
  }

  return parts.filter(Boolean).join(" · ");
};

module.exports = {
  CATEGORIES,
  characterImage,
  describeEquipment,
  equipmentLabel,
  findEquipment,
  inventoryCategories,
  normalizeEquipments,
  parseImages,
  shopCategories,
};
