const schemas = require("../../database/schemas");
const equipments = require("../../database/json/equipments.json");
const errors = require("../../utils/errors");
const economies = require("../../utils/economies");
const constants = require("../../utils/constants");

const searchItems = (equipments, playerClass, playerEquipments) => {
  Object.fromEntries(
    Object.entries(equipments).filter(
      ([name, equipment]) =>
        equipment.classes.includes(playerClass) &&
        !playerEquipments.inventory.includes(name),
    ),
  );
};

module.exports = {
  name: "buy",
  aliases: ["b"],
  description: "buy an equipments",
  category: "rpg",
  usage: "<equipment>",
  run: async (client, message, args) => {
    const character = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!character) {
      return message.reply(
        "You are not registered yet. Please type `" +
          client.prefixes.get(message.guild.id) +
          "register <class>` to register",
      );
    }

    const coins = await economies.getCoins(message.author);

    if (args.length < 1) {
      return errors.argsError(module.exports, client, message);
    }

    const playerClass = character.get("class");
    const playerEquipments = JSON.parse(character.get("equipments"));

    const weapons = searchItems(
      equipments.weapons,
      playerClass,
      playerEquipments.weapons,
    );

    const shields = searchItems(
      equipments.shields,
      playerClass,
      playerEquipments.shields,
    );

    const helmet = searchItems(
      equipments.helmet,
      playerClass,
      playerEquipments.helmet,
    );

    const armor = searchItems(
      equipments.armor,
      playerClass,
      playerEquipments.armor,
    );

    const gloves = searchItems(
      equipments.gloves,
      playerClass,
      playerEquipments.gloves,
    );

    const prompt = args.join("").toLowerCase();

    const weapon =
      weapons[
        Object.keys(weapons).find((name) => name.toLowerCase() === prompt)
      ];
    const shield =
      shields[
        Object.keys(shields).find((name) => name.toLowerCase() === prompt)
      ];
    const helmett =
      helmet[Object.keys(helmet).find((name) => name.toLowerCase() === prompt)];
    const armort =
      armor[Object.keys(armor).find((name) => name.toLowerCase() === prompt)];
    const glove =
      gloves[Object.keys(gloves).find((name) => name.toLowerCase() === prompt)];

    if (!(weapon || shield || helmett || armort || glove)) {
      return errors.argsError(module.exports, client, message);
    }

    if (weapon) {
      if (coins.get("wallet") < weapon.cost) {
        return message.reply("You don't have enough coins to buy this");
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") - weapon.cost,
        },
        { where: { userID: message.author.id } },
      );

      const name = Object.keys(weapons).find(
        (name) => name.toLowerCase() === prompt,
      );

      playerEquipments.weapons.inventory.push(name);

      message.reply(
        `You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
          constants.coins.emoji
        } ${weapon.cost}!`,
      );
    } else if (shield) {
      if (coins.get("wallet") < shield.cost) {
        return message.reply("You don't have enough coins to buy this");
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") - shield.cost,
        },
        { where: { userID: message.author.id } },
      );

      const name = Object.keys(shields).find(
        (name) => name.toLowerCase() === prompt,
      );

      playerEquipments.shields.inventory.push(name);

      message.reply(
        `You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
          constants.coins.emoji
        } ${shield.cost}!`,
      );
    } else if (helmett) {
      if (coins.get("wallet") < helmett.cost) {
        return message.reply("You don't have enough coins to buy this");
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") - helmett.cost,
        },
        { where: { userID: message.author.id } },
      );

      const name = Object.keys(helmet).find(
        (name) => name.toLowerCase() === prompt,
      );

      playerEquipments.helmet.inventory.push(name);

      message.reply(
        `You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
          constants.coins.emoji
        } ${helmett.cost}!`,
      );
    } else if (armort) {
      if (coins.get("wallet") < armort.cost) {
        return message.reply("You don't have enough coins to buy this");
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") - armort.cost,
        },
        { where: { userID: message.author.id } },
      );

      const name = Object.keys(armor).find(
        (name) => name.toLowerCase() === prompt,
      );

      playerEquipments.armor.inventory.push(name);

      message.reply(
        `You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
          constants.coins.emoji
        } ${armort.cost}!`,
      );
    } else if (glove) {
      if (coins.get("wallet") < glove.cost) {
        return message.reply("You don't have enough coins to buy this");
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") - glove.cost,
        },
        { where: { userID: message.author.id } },
      );

      const name = Object.keys(gloves).find(
        (name) => name.toLowerCase() === prompt,
      );

      playerEquipments.gloves.inventory.push(name);

      message.reply(
        `You bought ${name.replace(/([A-Z])/g, " $1").toLowerCase()} for ${
          constants.coins.emoji
        } ${glove.cost}!`,
      );
    }

    schemas.character().update(
      {
        equipments: JSON.stringify(playerEquipments),
      },
      { where: { userID: message.author.id } },
    );
  },
};
