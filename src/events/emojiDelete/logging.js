const { EmbedBuilder } = require("discord.js");

module.exports = async (client, emoji) => {
  const logging = client.loggings.get(emoji.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.emojiAndStickerChanges) {
    return;
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Emoji Deleted",
      iconURL: emoji.guild.iconURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Emoji:** ${emoji.name}`)
    .setFooter({ text: `emojiid: ${emoji.id}` })
    .setTimestamp();

  let logChannel;

  if (logging.serverLogChannel) {
    logChannel = await emoji.guild.channels.fetch(logging.serverLogChannel);
  } else {
    logChannel = await emoji.guild.channels.fetch(logging.defaultLogChannel);
  }

  logChannel.send({ embeds: [embed] });
};
