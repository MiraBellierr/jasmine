const { EmbedBuilder } = require("discord.js");

module.exports = async (client, ban) => {
  const logging = client.loggings.get(ban.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.memberUnbans) {
    return;
  }

  await ban.fetch();

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Member Unbanned",
      iconURL: ban.guild.iconURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Member:** ${ban.user.tag}\n**Reason:** ${ban.reason}`)
    .setFooter({ text: `memberid: ${ban.user.id}` })
    .setTimestamp();

  let logChannel;

  if (logging.memberLogChannel) {
    logChannel = await ban.guild.channels.fetch(logging.serverLogChannel);
  } else {
    logChannel = await ban.guild.channels.fetch(logging.defaultLogChannel);
  }

  logChannel.send({ embeds: [embed] });
};
