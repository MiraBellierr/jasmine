const Discord = require("discord.js");
const utils = require("../../utils/utils");

module.exports = {
  name: "nope",
  description: "I disagreed",
  category: "roleplay",
  run: async (client, message) => {
    const url = await utils.nekoapi(module.exports.name);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${message.author.username} said ${module.exports.name}!`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C");

    message.reply({ embeds: [embed] });
  },
};
