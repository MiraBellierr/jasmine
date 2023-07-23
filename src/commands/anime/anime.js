const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const Paginate = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");

module.exports = {
  name: "anime",
  description: "Search for an Anime, character or Manga",
  category: "anime",
  usage: "<name> [--anime | --characters | --manga]",
  run: async (client, message, args) => {
    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    const m = await message.reply("*please wait...*");

    const contents = args.join(" ").split("--");
    const query = encodeURIComponent(contents[0]);
    let type = "anime";

    if (contents[1]) {
      type = contents[1];
    }

    axios({
      method: "get",
      url: `https://api.jikan.moe/v4/${type}?q=${query}`,
      headers: {
        "Content-Type": "application/json",
      },
    }).then(
      async (response) => {
        if (type === "anime") {
          const animes = response.data.data;
          const embeds = [];

          for (const anime of animes) {
            const startDate = moment(anime.aired.from).format("MMMM Do YYYY");
            const endDate = moment(anime.aired.to).format("MMMM Do YYYY");

            const embed = new Discord.EmbedBuilder()
              .setAuthor({
                name: "Anime Search",
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle(anime.title)
              .setURL(anime.url)
              .setThumbnail(client.user.displayAvatarURL())
              .setDescription(anime.synopsis)
              .addFields([
                {
                  name: "Type",
                  value: `${anime.type ? anime.type : "N/A"}`,
                  inline: true,
                },
                {
                  name: "Episodes",
                  value: anime.episodes === null ? "???" : `${anime.episodes}`,
                  inline: true,
                },
                {
                  name: "Score",
                  value: `${anime.score ? anime.score : "???"}`,
                  inline: true,
                },
                {
                  name: "Aired from",
                  value: `${startDate ? startDate : "???"}`,
                  inline: true,
                },
                {
                  name: "Aired to",
                  value: anime.aired.to === null ? "???" : `${endDate}`,
                  inline: true,
                },
                {
                  name: "status",
                  value: `${anime.status}`,
                  inline: true,
                },
                {
                  name: "Rating",
                  value: `${anime.rating ? anime.rating : "???"}`,
                  inline: true,
                },
              ])
              .setColor("#CD1C6C")
              .setImage(anime.images.jpg.image_url)
              .setTimestamp()
              .setFooter({ text: `ID: ${anime.mal_id}` });

            embeds.push(embed);
          }

          m.delete();

          new Paginate.Paginate(client, message, embeds).init();
        } else if (type === "characters") {
          const characters = response.data.data;
          const embeds = [];

          for (const character of characters) {
            const embed = new Discord.EmbedBuilder()
              .setAuthor({
                name: "Character Search",
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle(character.name)
              .setURL(character.url)
              .setThumbnail(client.user.displayAvatarURL())
              .addFields([
                {
                  name: "Kanji name",
                  value:
                    character.name_kanji === null
                      ? "???"
                      : character.name_kanji,
                },
              ])
              .setDescription(character.about)
              .setColor("#CD1C6C")
              .setImage(character.images.jpg.image_url)
              .setTimestamp()
              .setFooter({ text: `ID: ${character.mal_id}` });

            embeds.push(embed);
          }

          m.delete();

          new Paginate.Paginate(client, message, embeds).init();
        } else if (type === "manga") {
          const mangas = response.data.data;
          const embeds = [];

          for (const manga of mangas) {
            const startDate = moment(manga.published.from).format(
              "MMMM Do YYYY"
            );
            const endDate = moment(manga.published.to).format("MMMM Do YYYY");

            const embed = new Discord.EmbedBuilder()
              .setAuthor({
                name: "Manga Search",
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle(manga.title)
              .setURL(manga.url)
              .setThumbnail(client.user.displayAvatarURL())
              .setDescription(manga.synopsis)
              .addFields([
                {
                  name: "Type",
                  value: `${manga.type ? manga.type : "???"}`,
                  inline: true,
                },
                {
                  name: "Chapters",
                  value: manga.chapters === 0 ? "???" : `${manga.chapters}`,
                  inline: true,
                },
                {
                  name: "Volumes",
                  value: manga.volumes === 0 ? "???" : `${manga.volumes}`,
                  inline: true,
                },
                {
                  name: "Score",
                  value: `${manga.score ? manga.score : "???"}`,
                  inline: true,
                },
                {
                  name: "Published from",
                  value: `${startDate ? startDate : "???"}`,
                  inline: true,
                },
                {
                  name: "Published to",
                  value: manga.published.to === null ? "???" : `${endDate}`,
                  inline: true,
                },
                {
                  name: "Rank",
                  value: `${manga.rank === null ? "???" : manga.rank}`,
                  inline: true,
                },
              ])
              .setColor("#CD1C6C")
              .setImage(manga.images.jpg.image_url)
              .setTimestamp()
              .setFooter({ text: `ID: ${manga.mal_id}` });

            embeds.push(embed);
          }
          m.delete();

          new Paginate.Paginate(client, message, embeds).init();
        } else {
          return argsError(module.exports, client, message);
        }
      },
      () => {
        m.delete();

        return message.reply("I didn't find any result");
      }
    );
  },
  interaction: {
    data: {
      name: "anime",
      type: 1,
      description: "Search for an anime",
      options: [
        {
          name: "anime",
          type: 1,
          description: "Search for an anime",
          options: [
            {
              name: "title",
              type: 3,
              description: "The title of the anime",
              required: true,
            },
          ],
        },
        {
          name: "characters",
          type: 1,
          description: "Search for a character",
          options: [
            {
              name: "name",
              type: 3,
              description: "The name of the character",
              required: true,
            },
          ],
        },
        {
          name: "manga",
          type: 1,
          description: "Search for a manga",
          options: [
            {
              name: "title",
              type: 3,
              description: "The title of the manga",
              required: true,
            },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const contents =
        interaction.options.getString("title") ||
        interaction.options.getString("name");

      const query = encodeURIComponent(contents);
      const type = interaction.options.getSubcommand();

      axios({
        method: "get",
        url: `https://api.jikan.moe/v4/${type}?q=${query}`,
        headers: {
          "Content-Type": "application/json",
        },
      }).then(
        async (response) => {
          if (type === "anime") {
            const animes = response.data.data;
            const embeds = [];

            for (const anime of animes) {
              const startDate = moment(anime.aired.from).format("MMMM Do YYYY");
              const endDate = moment(anime.aired.to).format("MMMM Do YYYY");

              const embed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: "Anime Search",
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle(anime.title)
                .setURL(anime.url)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(anime.synopsis)
                .addFields([
                  {
                    name: "Type",
                    value: `${anime.type ? anime.type : "N/A"}`,
                    inline: true,
                  },
                  {
                    name: "Episodes",
                    value:
                      anime.episodes === null ? "???" : `${anime.episodes}`,
                    inline: true,
                  },
                  {
                    name: "Score",
                    value: `${anime.score ? anime.score : "???"}`,
                    inline: true,
                  },
                  {
                    name: "Aired from",
                    value: `${startDate ? startDate : "???"}`,
                    inline: true,
                  },
                  {
                    name: "Aired to",
                    value: anime.aired.to === null ? "???" : `${endDate}`,
                    inline: true,
                  },
                  {
                    name: "status",
                    value: `${anime.status}`,
                    inline: true,
                  },
                  {
                    name: "Rating",
                    value: `${anime.rating ? anime.rating : "???"}`,
                    inline: true,
                  },
                ])
                .setColor("#CD1C6C")
                .setImage(anime.images.jpg.image_url)
                .setTimestamp()
                .setFooter({ text: `ID: ${anime.mal_id}` });

              embeds.push(embed);
            }

            new Paginate.Paginate(client, interaction, embeds).init();
          } else if (type === "characters") {
            const characters = response.data.data;
            const embeds = [];

            for (const character of characters) {
              const embed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: "Character Search",
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle(character.name)
                .setURL(character.url)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields([
                  {
                    name: "Kanji name",
                    value:
                      character.name_kanji === null
                        ? "???"
                        : character.name_kanji,
                  },
                ])
                .setDescription(character.about)
                .setColor("#CD1C6C")
                .setImage(character.images.jpg.image_url)
                .setTimestamp()
                .setFooter({ text: `ID: ${character.mal_id}` });

              embeds.push(embed);
            }

            new Paginate.Paginate(client, interaction, embeds).init();
          } else if (type === "manga") {
            const mangas = response.data.data;
            const embeds = [];

            for (const manga of mangas) {
              const startDate = moment(manga.published.from).format(
                "MMMM Do YYYY"
              );
              const endDate = moment(manga.published.to).format("MMMM Do YYYY");

              const embed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: "Manga Search",
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle(manga.title)
                .setURL(manga.url)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(manga.synopsis)
                .addFields([
                  {
                    name: "Type",
                    value: `${manga.type ? manga.type : "???"}`,
                    inline: true,
                  },
                  {
                    name: "Chapters",
                    value: manga.chapters === 0 ? "???" : `${manga.chapters}`,
                    inline: true,
                  },
                  {
                    name: "Volumes",
                    value: manga.volumes === 0 ? "???" : `${manga.volumes}`,
                    inline: true,
                  },
                  {
                    name: "Score",
                    value: `${manga.score ? manga.score : "???"}`,
                    inline: true,
                  },
                  {
                    name: "Published from",
                    value: `${startDate ? startDate : "???"}`,
                    inline: true,
                  },
                  {
                    name: "Published to",
                    value: manga.published.to === null ? "???" : `${endDate}`,
                    inline: true,
                  },
                  {
                    name: "Rank",
                    value: `${manga.rank === null ? "???" : manga.rank}`,
                    inline: true,
                  },
                ])
                .setColor("#CD1C6C")
                .setImage(manga.images.jpg.image_url)
                .setTimestamp()
                .setFooter({ text: `ID: ${manga.mal_id}` });

              embeds.push(embed);
            }

            new Paginate.Paginate(client, interaction, embeds).init();
          }
        },
        () => {
          return interaction.reply("I didn't find any result");
        }
      );
    },
  },
};
