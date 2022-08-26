const { EmbedBuilder } = require("discord.js");

module.exports = async (client, message) => {
  if (message.author.bot) {
    return;
  }

  const logging = client.loggings.get(message.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.messageDeletion) {
    return;
  }

  if (logging.ignoredChannels) {
    const ignoredChannels = logging.ignoredChannels.split("|");

    if (ignoredChannels.includes(message.channel.id)) {
      return;
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Message Deleted",
      iconURL: message.author.displayAvatarURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(
      `**Member:** ${message.author}\n**Channel:** ${message.channel}`
    )
    .addFields([
      {
        name: "Message",
        value: `${message.cleanContent}`,
      },
    ])
    .setFooter({ text: `memberid: ${message.author.id}` })
    .setTimestamp();

  let channel = await message.guild.channels.fetch(logging.defaultLogChannel);

  channel.send({ embeds: [embed] });
};
