const Discord = require("discord.js");

module.exports = {
  name: "question",
  description: "Post a question for QOTD (Support server)",
  usage: "<question>",
  run: () => {
    return;
  },
  interaction: {
    data: {
      name: "question",
      type: 1,
      description: "Post your question for QOTD",
      options: [
        {
          name: "submit",
          type: 1,
          description: "Submit a question",
          options: [
            {
              name: "question",
              type: 3,
              description: "Your question",
              required: true,
            },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const guild = await client.guilds.fetch("864537979339014184");

      if (interaction.guildId !== guild) {
        interaction.reply({
          content: "You must join the support server first!",
          ephemeral: true,
        });

        return;
      }

      const question = interaction.options.getString("question");
      const channel = await client.channels.fetch("969402082434121798");
      const user = interaction.user.username;

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: user,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(question)
        .setColor("Blue")
        .setFooter({ text: "New QOTD Submission!" });

      channel.send({ embeds: [embed] });

      interaction.reply({
        content: `Your question has been submitted! | ${question}`,
        ephemeral: true,
      });
    },
  },
};
