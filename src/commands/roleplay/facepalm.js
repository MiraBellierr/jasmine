const Discord = require("discord.js");
const utils = require("../../utils/utils");
const { roleplayInteraction } = require("../../utils/slashCommands");

module.exports = {
  name: "facepalm",
  description: "SMH",
  category: "roleplay",
  run: async (client, message) => {
    const url = await utils.nekoapi(module.exports.name);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${message.author.username} ${module.exports.name}s.`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C");

    message.reply({ embeds: [embed] });
  },
  interaction: roleplayInteraction("facepalm", "SMH", { command: () => module.exports }),
};
