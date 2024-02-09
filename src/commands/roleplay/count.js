const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const utils = require("../../utils/utils");
const schemas = require("../../database/schemas");
const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize("database", "username", "password", {
  dialect: "sqlite",
  storage: "database.sqlite",
});

module.exports = {
  name: "count",
  description: "action count",
  category: "roleplay",
  usage: "<action> <member>",
  run: async (client, message, args) => {
    let target, action;

    if (!args[0]) {
      return argsError(module.exports, client, message);
    } else if (args.length > 1) {
      action = args[0].toLowerCase();
      target = await getMemberFromArguments(message, args[1]);
    } else {
      target = message.member;
      action = args[0].toLowerCase();
    }

    const validate = await schemas.roleplay().findOne({
      where: {
        actionType: action,
      },
    });

    if (!validate) {
      return message.reply("I didnt find that action in my database.");
    }

    const highestHugGiver = await schemas.roleplay().findAll({
      attributes: [
        "userID",
        [Sequelize.fn("COUNT", Sequelize.col("userID")), "total"],
      ],
      where: {
        targetId: target.user.id,
        actionType: action,
      },
      group: ["userID"],
      order: [[Sequelize.literal("total"), "DESC"]],
      limit: 5,
    });

    const inOrder = highestHugGiver.map(async (hug, i) => {
      const hugger = await client.users.fetch(hug.dataValues.userID);
      return `[**${i + 1}**] - ${hugger.username} - **${hug.dataValues.total}** times!`;
    });

    if (!target) {
      return message.reply("I didn't found the user with this name");
    }

    Promise.all(inOrder).then((res) => {
      if (res.length < 1) return message.reply(`No one ${action} you yet!`);

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${target.user.username}`,
          iconURL: target.user.displayAvatarURL(),
        })
        .setTitle(`${target.user.username}'s top ${action}`)
        .setDescription(res.join("\n"))
        .setColor("#CD1C6C");

      message.reply({ embeds: [embed] });
    });
  },
};
