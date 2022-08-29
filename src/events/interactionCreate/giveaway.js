const schemas = require("../../database/schemas");
const Giveaway = require("../../utils/giveaway");
const Discord = require("discord.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  let giveawayDatabase = await schemas.Giveaway().findAll();

  giveawayDatabase = giveawayDatabase.map((g) =>
    JSON.parse(g.dataValues.options)
  );

  giveawayDatabase.forEach((op) => {
    let temp = new Discord.Collection();
    if (interaction.customId === op.id) {
      if (op.ended) return;
      if (op.participants.length < 1) {
        op.participants = new Discord.Collection();
      } else {
        op.participants.forEach((participant) => {
          temp.set(participant.id, participant);
        });

        op.participants = temp;
      }
      if (op.winners.length < 1) op.winners = new Discord.Collection();

      if (op.participants.has(interaction.user.id)) {
        op.participants.delete(interaction.user.id);
        interaction.reply({
          content: `You have left **${op.prize}** giveaway. :(`,
          ephemeral: true,
        });
      } else {
        op.participants.set(interaction.user.id, interaction.user);
        interaction.reply({
          content: `You have joined **${op.prize}** giveaway!`,
          ephemeral: true,
        });
      }

      console.log(op);
      new Giveaway(client).update(op);
    }
  });
};
