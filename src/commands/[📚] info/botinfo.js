const Discord = require("discord.js");
const discordjs = require("../../../node_modules/discord.js/package.json");
const utils = require("../../utils/utils");
const sqlite = require("../../../node_modules/sqlite3/package.json");
const jasmine = require("../../../package.json");

module.exports = {
  name: "botinfo",
  aliases: ["bot"],
  category: "[📚] info",
  description: "Shows bot information",
  run: async (client, message) => {
    const m = await message.channel.send("*Please wait...*");
    const clientApplication = await client.application.fetch();
    const owner = clientApplication.owner.tag;

    let totalSeconds = client.uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const uptime = `${days} days, ${hours} hours, ${minutes} minutes`;

    m.delete();

    const embed = new Discord.EmbedBuilder()
      .setAuthor({ name: "Bot Information" })
      .setThumbnail(client.user.avatarURL())
      .setColor("#DA70D6")
      .setDescription(
        `**• Version:** ${jasmine.name} v${
          jasmine.version
        }\n**• Developer:** ${owner}\n**• Tag:** ${
          client.user.tag
        }\n**• Cached Members:** ${client.users.cache.size.toLocaleString()}\n**• Total Members:** ${client.guilds.cache
          .map((guild) => guild.memberCount)
          .reduce((accumulator, currentValue) => accumulator + currentValue)
          .toLocaleString()}\n**• Total Servers:** ${client.guilds.cache.size.toLocaleString()}\n**• Total Shards:** ${client.shard.count.toLocaleString()}\n**• Total Channels:** ${client.channels.cache.size.toLocaleString()}\n**• Total Emojis:** ${client.emojis.cache.size.toLocaleString()}\n**• Created At:** ${utils.formatDate(
          client.user.createdAt
        )}\n**• Library:** ${discordjs.name} v${
          discordjs.version
        }\n**• Database:** ${sqlite.name} v${sqlite.version}\n**• JRE:** Node ${
          process.version
        }\n**• Websocket Ping:** ${client.ws.ping.toLocaleString()}ms\n**• Ready At:** ${utils.formatDate(
          client.readyAt
        )}\n**• Uptime:** ${uptime}\n**• Github:** [Click Here](${
          jasmine.homepage
        })`
      );

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "botinfo",
      type: 1,
      description: "Shows bot information",
    },
    run: async (client, interaction) => {
      const clientApplication = await client.application.fetch();
      const owner = clientApplication.owner.tag;

      let totalSeconds = client.uptime / 1000;
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      const minutes = Math.floor(totalSeconds / 60);
      const uptime = `${days} days, ${hours} hours, ${minutes} minutes`;

      const embed = new Discord.EmbedBuilder()
        .setAuthor({ name: "Bot Information" })
        .setThumbnail(client.user.avatarURL())
        .setColor("#DA70D6")
        .setDescription(
          `**• Version:** ${jasmine.name} v${
            jasmine.version
          }\n**• Developer:** ${owner}\n**• Tag:** ${
            client.user.tag
          }\n**• Cached Members:** ${client.users.cache.size.toLocaleString()}\n**• Total Members:** ${client.guilds.cache
            .map((guild) => guild.memberCount)
            .reduce((accumulator, currentValue) => accumulator + currentValue)
            .toLocaleString()}\n**• Total Servers:** ${client.guilds.cache.size.toLocaleString()}\n**• Total Shards:** ${client.shard.count.toLocaleString()}\n**• Total Channels:** ${client.channels.cache.size.toLocaleString()}\n**• Total Emojis:** ${client.emojis.cache.size.toLocaleString()}\n**• Created At:** ${utils.formatDate(
            client.user.createdAt
          )}\n**• Library:** ${discordjs.name} v${
            discordjs.version
          }\n**• Database:** ${sqlite.name} v${
            sqlite.version
          }\n**• JRE:** Node ${
            process.version
          }\n**• Websocket Ping:** ${client.ws.ping.toLocaleString()}ms\n**• Ready At:** ${utils.formatDate(
            client.readyAt
          )}\n**• Uptime:** ${uptime}\n**• Github:** [Click Here](${
            jasmine.homepage
          })`
        );

      interaction.reply({ embeds: [embed] });
    },
  },
};
