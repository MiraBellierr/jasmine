const axios = require("axios");
const Discord = require("discord.js");

module.exports = {
  name: "waifu",
  category: "anime",
  description: `Send waifu image`,
  run: async (client, message) => {
    axios({
      method: "get",
      url: `https://nekos.best/api/v2/${module.exports.name}`,
    }).then((res) => {
      const data = res.data;
      const embed = new Discord.EmbedBuilder()
        .setImage(data.results[0].url)
        .setAuthor({
          name: client.user.username,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`Here's your ${module.exports.name}!`)
        .setColor("#CD1C6C")
        .setFooter({ text: `by ${data.results[0].artist_name}` });

      message.channel.send({ embeds: [embed] });
    });
  },
  interaction: {
    data: {
      name: "waifu",
      type: 1,
      description: `Send waifu image`,
    },
    run: async (client, interaction) => {
      axios({
        method: "get",
        url: `https://nekos.best/api/v2/${module.exports.name}`,
      }).then((res) => {
        const data = res.data;
        const embed = new Discord.EmbedBuilder()
          .setImage(data.results[0].url)
          .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle(`Here's your ${module.exports.name}!`)
          .setColor("#CD1C6C")
          .setFooter({ text: `by ${data.results[0].artist_name}` });

        interaction.reply({ embeds: [embed] });
      });
    },
  },
};
