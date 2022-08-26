const Discord = require("discord.js");
const ud = require("urban-dictionary");
const Paginate = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");
const badwords = require("../../database/json/badwords.json");

module.exports = {
  name: "urban",
  aliases: ["ud"],
  description: "Send an urban definition about a word",
  category: "[✨] utility",
  usage: "<word>",
  run: async (client, message, args) => {
    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    ud.define(args.join(" ")).then(
      async (result) => {
        const pages = [];

        for (let i = 0; i < result.length; i++) {
          const definition = filter(
            result[i].definition.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
          );

          const example = filter(
            result[i].example.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
          );

          const embed = new Discord.EmbedBuilder()
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTitle(result[i].word)
            .setURL(result[i].permalink)
            .setColor("#CD1C6C")
            .setDescription(Discord.escapeMarkdown(definition))
            .addFields([
              { name: "example", value: `${Discord.escapeMarkdown(example)}` },
              {
                name: "Upvotes",
                value: `${result[i].thumbs_up}`,
                inline: true,
              },
            ])
            .setFooter({
              text: `Written by ${result[i].author} | Page ${i + 1}/${
                result.length
              }`,
            })
            .setTimestamp();

          pages.push(embed);
        }

        new Paginate.Paginate(client, message, pages).init();
      },
      async () => {
        message.reply("I can't find the urban definition for that word");
      }
    );
  },
  interaction: {
    data: {
      name: "urban",
      type: 1,
      description: "Send an urban definition about a word",
      options: [
        {
          name: "word",
          type: 3,
          description: "The word to define",
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      ud.define(interaction.options.getString("word")).then(
        async (result) => {
          const pages = [];

          for (let i = 0; i < result.length; i++) {
            const definition = filter(
              result[i].definition.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
            );

            const example = filter(
              result[i].example.replace(/[\[+]/gm, "").replace(/[\]+]/gm, "")
            );

            const embed = new Discord.EmbedBuilder()
              .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
              })
              .setTitle(result[i].word)
              .setURL(result[i].permalink)
              .setColor("#CD1C6C")
              .setDescription(Discord.escapeMarkdown(definition))
              .addFields([
                {
                  name: "example",
                  value: `${Discord.escapeMarkdown(example)}`,
                },
                {
                  name: "Upvotes",
                  value: `${result[i].thumbs_up}`,
                  inline: true,
                },
              ])
              .setFooter({
                text: `Written by ${result[i].author} | Page ${i + 1}/${
                  result.length
                }`,
              })
              .setTimestamp();

            pages.push(embed);
          }

          new Paginate.Paginate(client, interaction, pages).init();
        },
        async () => {
          interaction.reply("I can't find the urban definition for that word");
        }
      );
    },
  },
};

function filter(words) {
  let filtered = words;

  for (const badword of badwords) {
    filtered = filtered.replace(
      new RegExp(badword, "gi"),
      "*".repeat(badword.length)
    );
  }

  return filtered;
}
