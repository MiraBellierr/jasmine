const { EmbedBuilder } = require("discord.js");

module.exports = async (client, member) => {
  const ms = (await import("parse-ms")).default;

  const logging = client.loggings.get(member.guild.id);

  if (!(logging && logging.defaultLogChannel)) {
    return;
  }

  if (!logging.memberJoin) {
    return;
  }

  const accountAge =
    ms(Date.now() - member.user.createdAt).days < 1
      ? "Less than a day"
      : `${ms(Date.now() - member.user.createdAt).days} days old`;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Member Joined",
      iconURL: member.user.displayAvatarURL(),
    })
    .setColor("#CD1C6C")
    .setDescription(`**Member:** ${member}\n**Account Age:** ${accountAge}`)
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
