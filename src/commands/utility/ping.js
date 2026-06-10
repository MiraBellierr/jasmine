const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  category: "utility",
  description: "Returns latency and API ping",
  run: async (client, message) => {
    const msg = await message.reply("🏓 Pinging....");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor("#CD1C6C")
      .setTitle("🏓 Pong")
      .addFields([
        {
          name: "Latency",
          value: `${Math.floor(
            msg.createdTimestamp - message.createdTimestamp
          )}ms`,
        },
        {
          name: "API Latency",
          value: `${Math.floor(client.ws.ping)}ms`,
        },
      ])
      .setTimestamp()
      .setFooter({
        text: client.user.tag,
        iconURL: client.user.avatarURL(),
      });

    message.reply({ embeds: [embed] });

    msg.delete();
  },
  interaction: {
    data: {
      name: "ping",
      type: 1,
      description: "Returns latency and API ping",
    },
    run: async (client, interaction) => {
      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor("#CD1C6C")
        .setTitle("🏓 Pong")
        .addFields([
          {
            name: "Latency",
            value: `${Math.floor(
              Date.now() - interaction.createdTimestamp
            )}ms`,
          },
          {
            name: "API Latency",
            value: `${Math.floor(client.ws.ping)}ms`,
          },
        ])
        .setTimestamp()
        .setFooter({
          text: client.user.tag,
          iconURL: client.user.avatarURL(),
        });

      interaction.editReply({ embeds: [embed] });
    },
  },
};
