const Discord = require("discord.js");
const { getUserFromArguments } = require("../../utils/getters");
const constants = require("../../utils/constants");
const economy = require("../../utils/economies");

module.exports = {
  name: "wallet",
  aliases: ["bal", "money", "cash", "balance"],
  description: "Shows user balance",
  category: "[🎩] economy",
  usage: "[user]",
  run: async (client, message, args) => {
    const user =
      (await getUserFromArguments(message, args.join())) || message.author;

    const coins = await economy.getCoins(user);

    if (!coins) {
      return message.reply(
        `${user.username} hasn't registered yet! Use \`${constants.prefix}register <class>\` to register.`
      );
    }

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `${user.username}'s balance`,
      })
      .setThumbnail(user.displayAvatarURL())
      .setColor("#DA70D6")
      .setFooter({
        text: "https://patreon.com/jasminebot",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        `**Wallet:** ${constants.coins.emoji} ${coins
          .get("wallet")
          .toLocaleString()}`
      );

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "wallet",
      type: 1,
      description: "Shows user balance",
      options: [
        {
          name: "user",
          description: "The user to show the balance of.",
          type: 6,
        },
      ],
    },
    run: async (client, interaction) => {
      const user = interaction.options.getUser("user") || interaction.user;

      const coins = await economy.getCoins(user);

      if (!coins) {
        return interaction.reply(`${user.username} hasn't registered yet!`);
      }

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${user.username}'s balance`,
        })
        .setThumbnail(user.displayAvatarURL())
        .setColor("#DA70D6")
        .setFooter({
          text: "https://patreon.com/jasminebot",
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
          `**Wallet:** ${constants.coins.emoji} ${coins
            .get("wallet")
            .toLocaleString()}`
        );

      interaction.reply({ embeds: [embed] });
    },
  },
};
