const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "meme",
  description: "Sends a random meme",
  category: "meme",
  run: async (client, message) => {
    const response = await axios.get(`https://meme-api.com/gimme`);
    const meme = response.data;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `By ${meme.author} - `,
        iconURL: client.user.avatarURL(),
      })
      .setTitle(meme.title)
      .setURL(meme.postLink)
      .setImage(meme.url)
      .setFooter({
        text: `⬆️ ${meme.ups} | 💬 r/${meme.subreddit}`,
      });

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "meme",
      description: "Sends a random meme",
      type: 1,
    },
    run: async (client, interaction) => {
      const response = await axios.get(`https://meme-api.com/gimme`);
      const meme = response.data;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `By ${meme.author} - `,
          iconURL: client.user.avatarURL(),
        })
        .setTitle(meme.title)
        .setURL(meme.postLink)
        .setImage(meme.url)
        .setFooter({
          text: `⬆️ ${meme.ups} | 💬 r/${meme.subreddit}`,
        });

      interaction.reply({ embeds: [embed] });
    },
  },
};
