const Discord = require("discord.js");
const utils = require("../../utils/utils");
const { roleplayInteraction } = require("../../utils/slashCommands");

module.exports = {
  name: "nom",
  description: "Nom nom",
  category: "roleplay",
  run: async (client, message) => {
    const url = await utils.nekoapi(module.exports.name);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: "Nom nom!",
        iconURL: message.author.displayAvatarURL(),
      })
      .setImage(url)
      .setColor("#CD1C6C");

    message.reply({ embeds: [embed] });
  },
  interaction: roleplayInteraction("nom", "Nom nom", { command: () => module.exports }),
};
