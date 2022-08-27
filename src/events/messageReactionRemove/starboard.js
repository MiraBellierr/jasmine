const Discord = require("discord.js");

module.exports = async (client, messageReaction) => {
  const message = messageReaction.message;
  const starboardObj = client.starboards.get(message.guild.id);

  if (!(starboardObj && starboardObj.switch)) {
    return;
  }
  if (messageReaction.emoji.name !== "⭐") {
    return;
  }

  const starboardChannel = await message.guild.channels.fetch(
    starboardObj.channelID
  );

  const fetch = await starboardChannel.messages.fetch();

  const stars = fetch.find(
    (m) => m.content.startsWith("⭐") && m.content.endsWith(message.id)
  );

  if (stars) {
    if (messageReaction.count < starboardObj.star) {
      return stars.delete();
    }

    // eslint-disable-next-line no-useless-escape
    const star = /^\⭐\s([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(stars.content);
    const foundStar = stars.embeds[0];
    const embed = new Discord.EmbedBuilder()
      .setColor(foundStar.color)
      .setThumbnail(foundStar.thumbnail.url)
      .setDescription(foundStar.description)
      .addFields([
        {
          name: `${foundStar.fields[0].name}`,
          value: `${foundStar.fields[0].value}`,
          inline: true,
        },
        {
          name: `${foundStar.fields[1].name}`,
          value: `${foundStar.fields[1].value}`,
          inline: true,
        },
      ])
      .setTimestamp(Date.now(foundStar.timestamp));
    if (foundStar.fields[2]) {
      embed.addFields([
        { name: foundStar.fields[2].name, value: foundStar.fields[2].value },
      ]);
    }
    if (foundStar.image) {
      embed.setImage(foundStar.image.url);
    }

    const starMsg = await starboardChannel.messages.fetch(stars.id);

    await starMsg.edit({
      content: `⭐ ${parseInt(star[1]) - 1} | ${message.id}`,
      embeds: [embed],
    });
  }
};
