const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const utils = require("../../utils/utils");
const { getCount } = require("../../utils/economies");

module.exports = {
  name: "feed",
  description: "feed someone",
  category: "roleplay",
  usage: "<member>",
  run: async (client, message, args) => {
    let target;

    if (message.reference && message.reference.messageId) {
      const msg = message.channel.messages.cache.find(
        (mssg) => mssg.id === message.reference.messageId,
      );

      target = msg.member;
    } else if (!args.length) {
      return argsError(module.exports, client, message);
    } else {
      target = await getMemberFromArguments(message, args.join(" "));
    }

    if (!target) {
      return message.reply("I didn't found the user with this name");
    }

    const url = await utils.nekoapi(module.exports.name);

    if (target.id === message.author.id) {
      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${client.user.username} ${module.exports.name}s ${target.user.username}!`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setImage(url)
        .setColor("#CD1C6C");

      return message.reply({ embeds: [embed] });
    }

    const count = await getCount(message, target, "feed");

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${message.author.username} ${module.exports.name}s ${target.user.username}!`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C")
      .setFooter({
        text: `${target.user.username} has been fed by ${message.user.username} ${count} times!`,
      });

    message.reply({ embeds: [embed] });
  },
};
