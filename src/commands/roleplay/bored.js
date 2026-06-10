const Discord = require("discord.js");
const utils = require("../../utils/utils");
const { roleplayInteraction } = require("../../utils/slashCommands");

module.exports = {
  name: "bored",
  description: "Im bored",
  category: "roleplay",
  run: async (client, message) => {
    const url = await utils.nekoapi(module.exports.name);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${message.author.username} is ${module.exports.name}.`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C");

    message.reply({ embeds: [embed] });
  },
  interaction: roleplayInteraction("bored", "Im bored", { command: () => module.exports }),
};
