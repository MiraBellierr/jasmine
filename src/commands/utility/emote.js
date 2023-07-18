const { EmbedBuilder } = require("discord.js");
const { Paginate } = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");

module.exports = {
  name: "emote",
  aliases: ["emoji"],
  description: "Enlarge an emoji",
  category: "utility",
  usage: "<emote>",
  run: async (client, message, args) => {
    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    const emojis = [];

    args.forEach((arg) => {
      const emoji = arg.replace(/\D+/gm, "");
      const check = /<(a)?:\D+:\d+>/gm.test(arg);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor("#CD1C6C")
        .setTimestamp()
        .setFooter({
          text: client.user.tag,
          iconURL: client.user.avatarURL(),
        });

      if (/<a:\D+:\d+>/gm.test(arg)) {
        embed.setImage(`https://cdn.discordapp.com/emojis/${emoji}.gif`);
        emojis.push(embed);
      } else if (/<:\D+:\d+>/gm.test(arg)) {
        embed.setImage(`https://cdn.discordapp.com/emojis/${emoji}.png`);
        emojis.push(embed);
      } else if (!check) {
        // do nothing
      }
    });

    if (!emojis.length) {
      return message.reply("Emojis can't be found.");
    }

    new Paginate(client, message, emojis).init();
  },
  interaction: {
    data: {
      name: "emote",
      description: "Enlarge an emoji",
      type: 1,
      options: [
        {
          name: "emote",
          description: "The emote to enlarge",
          type: 3,
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      const args = interaction.options.getString("emote").split(" ");

      const emojis = [];

      args.forEach((arg) => {
        const emoji = arg.replace(/\D+/gm, "");
        const check = /<(a)?:\D+:\d+>/gm.test(arg);

        const embed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor("#CD1C6C")
          .setTimestamp()
          .setFooter({
            text: client.user.tag,
            iconURL: client.user.avatarURL(),
          });

        if (/<a:\D+:\d+>/gm.test(arg)) {
          embed.setImage(`https://cdn.discordapp.com/emojis/${emoji}.gif`);
          emojis.push(embed);
        } else if (/<:\D+:\d+>/gm.test(arg)) {
          embed.setImage(`https://cdn.discordapp.com/emojis/${emoji}.png`);
          emojis.push(embed);
        } else if (!check) {
          // do nothing
        }
      });

      if (!emojis.length) {
        return interaction.reply("Emojis can't be found.");
      }

      new Paginate(client, interaction, emojis).init();
    },
  },
};
