const { EmbedBuilder } = require("discord.js");

module.exports = async (client, invite) => {
  const logging = client.loggings.get(invite.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.discordInvites) {
    return;
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Invite Deleted",
      iconURL: invite.guild.iconURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Invite Code:** ${invite.code}`)
    .setTimestamp();

  let logChannel;

  if (logging.serverLogChannel) {
    logChannel = await invite.guild.channels.fetch(logging.serverLogChannel);
  } else {
    logChannel = await invite.guild.channels.fetch(logging.defaultLogChannel);
  }

  logChannel.send({ embeds: [embed] });
};
