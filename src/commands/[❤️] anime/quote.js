const axios = require("axios");

module.exports = {
  name: "quote",
  category: "[❤️] anime",
  description: "Quote from an Anime character",
  run: async (client, message) => {
    axios({
      method: "get",
      url: "https://animechan.vercel.app/api/random",
    }).then((res) => {
      return message.reply(
        `**“${res.data.quote}”**\n\n *―${res.data.character} (${res.data.anime})*`
      );
    });
  },
  interaction: {
    data: {
      name: "quote",
      type: 1,
      description: "Quote from an Anime character",
    },
    run: async (client, interaction) => {
      axios({
        method: "get",
        url: "https://animechan.vercel.app/api/random",
      }).then((res) => {
        return interaction.reply(
          `**“${res.data.quote}”**\n\n *―${res.data.character} (${res.data.anime})*`
        );
      });
    },
  },
};
