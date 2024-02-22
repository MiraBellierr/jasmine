const Battle = require("../../utils/rpg");
const { getMemberFromArguments } = require("../../utils/getters");

module.exports = {
  name: "battle",
  aliases: ["bt"],
  description: "Battle with another user",
  category: "rpg",
  usage: "[member]",
  run: async (client, message, args) => {
    if (!args.length) {
      new Battle(message, message.author).startRandom();
    } else {
      const target = await getMemberFromArguments(message, args.join(" "));

      if (!target) {
        return message.reply("I didn't found the user with this name");
      }

      const opponent = target.user;

      if (opponent.id === message.author.id) {
        return message.reply("You can't battle yourself");
      }

      new Battle(message, message.author).startOpponent(opponent);
    }
  },
  interaction: {
    data: {
      name: "battle",
      type: 1,
      description: "Battle with another user",
      options: [
        {
          name: "opponent",
          description: "Battle with your friend",
          type: 6,
        },
      ],
    },
    run: (client, interaction) => {
      const opponent = interaction.options.getUser("opponent");

      if (!opponent) {
        new Battle(interaction, interaction.user).startRandom();
      } else {
        new Battle(interaction, interaction.user).startOpponent(opponent);
      }
    },
  },
};
