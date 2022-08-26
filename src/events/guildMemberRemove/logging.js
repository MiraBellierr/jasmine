const { EmbedBuilder } = require("discord.js");

module.exports = async (client, member) => {
  const logging = client.loggings.get(member.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.memberLeave) {
    return;
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Member Left",
      iconURL: member.user.displayAvatarURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Member:** ${member.user.tag}`)
    .setFooter({ text: `Memberid: ${member.id}` })
    .setTimestamp();

  let logChannel;

  if (logging.joinLeaveLogChannel) {
    logChannel = await member.guild.channels.fetch(logging.joinLeaveLogChannel);
  } else {
    logChannel = await member.guild.channels.fetch(logging.defaultLogChannel);
  }

  logChannel.send({ embeds: [embed] });
};
