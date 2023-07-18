const Discord = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "topanime",
  aliases: ["top"],
  description: "Top 10 Anime | Characters | Manga",
  category: "anime",
  usage: "[anime | character | manga]",
  run: async (client, message, args) => {
    const m = await message.reply("*please wait...*");
    let type = "anime";
    const types = ["anime", "characters", "character", "manga"];

    if (args.length > 0) {
      type = args[0].toLowerCase();
    }
    if (!types.includes(type)) {
      type = "anime";
    }
    if (type === "character") {
      type = "characters";
    }

    axios({
      method: "get",
      url: `https://api.jikan.moe/v3/top/${type}`,
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (response) => {
      const top = response.data.top.splice(0, 10);
      const board = top
        .map((anime, i) => `**[${i + 1}] - [${anime.title}](${anime.url})**`)
        .join("\n");

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle(`Top 10 ${type}`)
        .setDescription(board)
        .setColor("#CD1C6C")
        .setTimestamp();

      m.delete();

      return message.reply({ embeds: [embed] });
    });
  },
  interaction: {
    data: {
      name: "topanime",
      type: 1,
      description: "Top 10 Anime | Characters | Manga",
      options: [
        {
          name: "query",
          type: 3,
          description: "Anime | Characters | Manga",
          choices: [
            {
              name: "Anime",
              value: "anime",
            },
            {
              name: "Characters",
              value: "characters",
            },
            {
              name: "Manga",
              value: "manga",
            },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const type = interaction.options.getString("query");

      axios({
        method: "get",
        url: `https://api.jikan.moe/v3/top/${type}`,
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (response) => {
        const top = response.data.top.splice(0, 10);
        const board = top
          .map((anime, i) => `**[${i + 1}] - [${anime.title}](${anime.url})**`)
          .join("\n");

        const embed = new Discord.EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle(`Top 10 ${type}`)
          .setDescription(board)
          .setColor("#CD1C6C")
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      });
    },
  },
};
