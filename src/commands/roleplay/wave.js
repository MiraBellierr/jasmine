const Discord = require("discord.js");
const { getMemberFromArguments } = require("../../utils/getters");
const utils = require("../../utils/utils");
const { getCount } = require("../../utils/economies");

module.exports = {
  name: "wave",
  description: "wave at someone",
  category: "roleplay",
  usage: "<member>",
  run: async (client, message, args) => {
    let target;

    if (message.reference && message.reference.messageId) {
      const msg = message.channel.messages.cache.find(
        (mssg) => mssg.id === message.reference.messageId,
      );

      target = msg.member;
    } else {
      target = await getMemberFromArguments(message, args.join(" "));
    }

    const url = await utils.nekoapi(module.exports.name);

    if (!target) {
      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${message.author.username} is ${module.exports.name.slice(
            0,
            3,
          )}ing.`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setImage(url)
        .setColor("#CD1C6C");

      message.reply({ embeds: [embed] });

      return;
    }

    if (target.id === message.author.id) {
      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${client.user.username} ${module.exports.name}s at ${target.user.username}!`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setImage(url)
        .setColor("#CD1C6C");

      return message.reply({ embeds: [embed] });
    }

    const count = await getCount(message, target, "wave");

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${message.author.username} ${module.exports.name}s at ${target.user.username}!`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C")
      .setFooter({
        text: `${target.user.username} has been waved by ${message.author.username} ${count} times!`,
      });

    message.reply({ embeds: [embed] });
  },
};
