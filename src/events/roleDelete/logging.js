const { EmbedBuilder } = require("discord.js");

module.exports = async (client, role) => {
  const logging = client.loggings.get(role.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.roleDeletion) {
    return;
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Role Deleted",
      iconURL: role.guild.iconURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Role:** ${role.name}`)
    .setFooter({ text: `roleid: ${role.id}` })
    .setTimestamp();

  let logChannel;

  if (logging.serverLogChannel) {
    logChannel = await role.guild.channels.fetch(logging.serverLogChannel);
  } else {
    logChannel = await role.guild.channels.fetch(logging.defaultLogChannel);
  }

  logChannel.send({ embeds: [embed] });
};
