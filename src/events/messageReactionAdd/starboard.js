const Discord = require("discord.js");

module.exports = async (client, messageReaction, user) => {
  const message = messageReaction.message;
  const starboardObj = client.starboards.get(message.guild.id);

  if (!(starboardObj && starboardObj.switch)) {
    return;
  }
  if (messageReaction.emoji.name !== "⭐") {
    return;
  }

  if (
    message.guild.members.me.permissions.has(
      Discord.PermissionsBitField.Flags.ManageMessages
    )
  ) {
    if (user.id === message.author.id) {
      messageReaction.users.remove(user);
    }
  }

  const starboardChannel = await message.guild.channels.fetch(
    starboardObj.channelID
  );

  const fetch = await starboardChannel.messages.fetch();

  const image =
    !message.embeds.length || message.embeds[0].type !== "image"
      ? message.attachments.size > 0
        ? extension(message.attachments.first().proxyURL)
        : ""
      : message.embeds[0].url;

  const stars = fetch.find(
    (m) => m.content.startsWith("⭐") && m.content.endsWith(message.id)
  );

  if (stars) {
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
      content: `⭐ ${parseInt(star[1]) + 1} | ${message.id}`,
      embeds: [embed],
    });
  } else {
    if (messageReaction.emoji.reaction.count < starboardObj.star) {
      return;
    }
    if (!image && message.cleanContent.length < 1) {
      return;
    }
    const embed = new Discord.EmbedBuilder()
      .setColor("#CD1C6C")
      .setDescription(
        `**[Jump to message!](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})**`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .addFields([
        { name: "Author", value: message.author.toString(), inline: true },
        { name: "Channel", value: message.channel.toString(), inline: true },
      ])
      .setTimestamp();

    if (image) {
      embed.setImage(image);
    }

    if (message.cleanContent.length > 0) {
      embed.addFields([{ name: "message", value: message.cleanContent }]);
    }

    starboardChannel.send({
      content: `⭐ ${messageReaction.emoji.reaction.count} | ${message.id}`,
      embeds: [embed],
    });
  }
};

function extension(attachment) {
  const imageLink = attachment.split(".");
  const typeOfImage = imageLink[imageLink.length - 1];
  const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);

  if (!image) {
    return "";
  }

  return attachment;
}
