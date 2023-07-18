module.exports = {
  name: "donate",
  description: "Donate to get extra perks",
  category: "utility",
  run: async (client, message) => {
    message.reply(
      "Donate any amount you want! It helps the creator afford a faster server for Jasmine! As a return, you will receive benefits!\nLink: https://www.patreon.com/jasminebot"
    );
  },
  interaction: {
    data: {
      name: "donate",
      description: "Donate to get extra perks",
      type: 1,
    },
    run: async (client, interaction) => {
      interaction.reply(
        "Donate any amount you want! It helps the creator afford a faster server for Jasmine! As a return, you will receive benefits!\nLink: https://www.patreon.com/jasminebot"
      );
    },
  },
};
