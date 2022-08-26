const { EmbedBuilder } = require("discord.js");

module.exports = async (client, oldState, newState) => {
  const logging = client.loggings.get(newState.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (logging.joinVoice) {
    if (oldState.channelId === null && newState.channelId !== null) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Member Joined Voice Channel",
          iconURL: newState.member.displayAvatarURL(),
        })
        .setColor("#CD1C6C")
        .setDescription(
          `**Member:** ${newState.member}\n**Channel:** ${newState.channel}`
        )
        .setFooter({ text: `memberid: ${newState.member.id}` })
        .setTimestamp();

      let logChannel;

      if (logging.voiceLogChannel) {
        logChannel = await newState.guild.channels.fetch(
          logging.voiceLogChannel
        );
      } else {
        logChannel = await newState.guild.channels.fetch(
          logging.defaultLogChannel
        );
      }
      logChannel.send({ embeds: [embed] });
    }
  }

  if (logging.moveBetweenVoiceChannels) {
    if (
      oldState.channelId !== null &&
      newState.channelId !== null &&
      oldState.channelId !== newState.channelId
    ) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Member Moved Voice Channel",
          iconURL: newState.member.displayAvatarURL(),
        })
        .setColor("#CD1C6C")
        .setDescription(`**Member:** ${newState.member}`)
        .addFields([
          {
            name: "Before",
            value: `Channel: ${oldState.channel}`,
          },
          {
            name: "After",
            value: `Channel: ${newState.channel}`,
          },
        ])
        .setFooter({ text: `memberid: ${newState.member.id}` })
        .setTimestamp();

      let logChannel;

      if (logging.voiceLogChannel) {
        logChannel = await newState.guild.channels.fetch(
          logging.voiceLogChannel
        );
      } else {
        logChannel = await newState.guild.channels.fetch(
          logging.defaultLogChannel
        );
      }
      logChannel.send({ embeds: [embed] });
    }
  }

  if (logging.leaveVoice) {
    if (oldState.channelId !== null && newState.channelId === null) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Member Left Voice Channel",
          iconURL: newState.member.displayAvatarURL(),
        })
        .setColor("#CD1C6C")
        .setDescription(
          `**Member:** ${newState.member}\n**Channel:** ${oldState.channel}`
        )
        .setFooter({ text: `memberid: ${newState.member.id}` })
        .setTimestamp();

      let logChannel;

      if (logging.voiceLogChannel) {
        logChannel = await newState.guild.channels.fetch(
          logging.voiceLogChannel
        );
      } else {
        logChannel = await newState.guild.channels.fetch(
          logging.defaultLogChannel
        );
      }
      logChannel.send({ embeds: [embed] });
    }
  }
};
