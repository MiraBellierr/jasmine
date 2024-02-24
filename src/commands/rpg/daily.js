const schemas = require("../../database/schemas");
const economies = require("../../utils/economies");
const constants = require("../../utils/constants");

module.exports = {
  name: "daily",
  description: "Daily to earn coins",
  category: "rpg",
  run: async (client, message) => {
    const coins = await economies.getCoins(message.author);

    if (!coins) {
      return message.reply(
        `You haven't registered yet! Please use \`${client.prefixes.get(message.guild.id)}register <class>\` to register.`,
      );
    }

    const timer = await economies.getCooldown(message.author, "daily", 864e5);

    if (timer) {
      return message.reply(
        `**${message.author.username}**, Please wait **${timer.hours}h ${timer.seconds}s** before you can claim your daily again.`,
      );
    }

    schemas.timer().update(
      {
        daily: Date.now(),
      },
      { where: { userID: message.author.id } },
    );

    const guild = await client.guilds.fetch(constants.supportServer.id);
    const member = await guild.members.fetch(message.author.id);

    let reward = 100;

    if (member && member.roles.cache.get(constants.patreon.id)) {
      reward = 200;
    }

    schemas.coins().update(
      {
        wallet: coins.get("wallet") + reward,
      },
      { where: { userID: message.author.id } },
    );

    const amount = `${constants.coins.emoji} ${reward}`;

    return message.reply(`You claimed your daily and got ${amount}!`);
  },
  interaction: {
    data: {
      name: "daily",
      type: 1,
      description: "Daily to earn coins",
    },
    run: async (client, interaction) => {
      const coins = await economies.getCoins(interaction.user);

      if (!coins) {
        return interaction.reply(
          `You haven't registered yet! Please use \`${constants.prefix}register <class>\` to register.`,
        );
      }

      const timer = await economies.getCooldown(
        interaction.user,
        "daily",
        864e5,
      );

      if (timer) {
        return interaction.reply(
          `**${interaction.user.username}**, Please wait **${timer.hours}h ${timer.seconds}s** before you can claim your daily again.`,
        );
      }

      schemas.timer().update(
        {
          daily: Date.now(),
        },
        { where: { userID: interaction.user.id } },
      );

      const guild = await client.guilds.fetch(constants.supportServer.id);

      const member = await guild.members.fetch(interaction.user.id);

      let reward = 100;

      if (member && member.roles.cache.get(constants.patreon.id)) {
        reward = 200;
      }

      schemas.coins().update(
        {
          wallet: coins.get("wallet") + reward,
        },
        { where: { userID: interaction.user.id } },
      );

      const amount = `${constants.coins.emoji} ${reward}`;

      return interaction.reply(`You claimed your daily and got ${amount}!`);
    },
  },
};
