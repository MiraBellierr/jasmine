const Battle = require("../../utils/rpg");

module.exports = {
  name: "battle",
  aliases: ["bt"],
  description: "Battle with another user",
  category: "[👹] rpg",
  usage: "[member]",
  run: async (client, message, args) => {
    new Battle(message, message.author).startRandom();
  },
  interaction: {
    data: {
      name: "battle",
      type: 1,
      description: "Battle with another user",
    },
    run: async (client, interaction) => {
      new Battle(interaction, interaction.user).startRandom();
    },
  },
};
