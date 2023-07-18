const Discord = require("discord.js");

module.exports = {
  name: "shardstatus",
  aliases: ["shard"],
  category: "info",
  description: "Shows the shards status",
  run: async (client, message) => {
    const shards = await client.shard.broadcastEval((client) => [
      client.shard.ids,
      client.ws.status,
      client.ws.ping,
      client.guilds.cache.size,
    ]);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor("#DA70D6")
      .setTitle(`📡 Total shards: (${client.shard.count})`)
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    shards.map((data) => {
      embed.addFields({
        name: `Shard ${data[0]}`,
        value: `**ID:** \`[ ${data[1]} ]\` | **Ping:** \`[ ${data[2]}ms ]\` | **Guilds:** \`[ ${data[3]} ]\``,
        inline: false,
      });
    });

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "shardstatus",
      description: "Shows the shards status",
      type: 1,
    },
    run: async (client, interaction) => {
      const shards = await client.shard.broadcastEval((client) => [
        client.shard.ids,
        client.ws.status,
        client.ws.ping,
        client.guilds.cache.size,
      ]);

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor("#DA70D6")
        .setTitle(`📡 Total shards: (${client.shard.count})`)
        .setFooter({
          text: client.user.username,
          iconURL: client.user.displayAvatarURL(),
        });

      shards.map((data) => {
        embed.addFields({
          name: `Shard ${data[0]}`,
          value: `**ID:** \`[ ${data[1]} ]\` | **Ping:** \`[ ${data[2]}ms ]\` | **Guilds:** \`[ ${data[3]} ]\``,
          inline: false,
        });
      });

      interaction.reply({ embeds: [embed] });
    },
  },
};
