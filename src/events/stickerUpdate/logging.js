const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldSticker, newSticker) => {
  const logging = client.loggings.get(newSticker.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.emojiAndStickerChanges) {
    return;
  }

  const differences = Object.keys(oldSticker).filter(
    (key) =>
      oldSticker[key] !== newSticker[key] && typeof newSticker[key] !== "object"
  );

  differences.forEach(async (diff) => {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Sticker ${diff.charAt(0).toUpperCase() + diff.slice(1)} Updated`,
        iconURL: newSticker.guild.iconURL(),
      })
      .setColor("#CD1C6C")
      .addFields([
        {
          name: "Before",
          value: `${oldSticker[diff] ? oldSticker[diff] : "N/A"}`,
        },
        {
          name: "After",
          value: `${newSticker[diff] ? newSticker[diff] : "N/A"}`,
        },
      ])
      .setFooter({ text: `stickerid: ${newSticker.id}` })
      .setTimestamp();

    let logChannel;

    if (logging.serverLogChannel) {
      logChannel = await newSticker.guild.channels.fetch(
        logging.serverLogChannel
      );
    } else {
      logChannel = await newSticker.guild.channels.fetch(
        logging.defaultLogChannel
      );
    }

    logChannel.send({ embeds: [embed] });
  });
};
