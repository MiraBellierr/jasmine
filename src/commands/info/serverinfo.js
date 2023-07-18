const Discord = require("discord.js");
const utils = require("../../utils/utils");

module.exports = {
  name: "serverinfo",
  aliases: ["server", "guild", "guildinfo"],
  description: "shows server information",
  category: "info",
  run: async (client, message) => {
    const verlvl = {
      0: "None",
      1: "Low",
      2: "Medium",
      3: "(╯°□°）╯︵ ┻━┻",
      4: "(ノಠ益ಠ)ノ彡┻━┻",
    };
    const verlvl2 = {
      0: "Disabled",
      1: "Apply To Members Without Roles Only",
      2: "Apply To All Members",
    };

    const guild = await client.guilds.fetch(message.guild.id);

    const created = utils.formatDate(message.guild.createdAt);

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(guild.name)
      .addFields([
        {
          name: "Server Information 1",
          value: `**• Name:** ${guild.name}\n**• ID:** ${
            guild.id
          }\n**• Owner:** ${guild.members.cache.get(
            guild.ownerId
          )}\n**• Owner ID:** ${
            guild.ownerId
          }\n**• Created At:** ${created}\n**• Text Channels:** ${
            guild.channels.cache.filter(
              (c) => c.type === Discord.ChannelType.GuildText
            ).size
          } channels\n**• Voice Channels:** ${
            guild.channels.cache.filter(
              (c) => c.type === Discord.ChannelType.GuildVoice
            ).size
          } channels\n**• Roles:** ${
            guild.roles.cache.size
          } roles\n**• Emojis:** ${
            guild.emojis.cache.size
          } emojis\n**• Stickers:** ${
            guild.stickers.cache.size
          } stickers\n**• Humans:** ${
            guild.memberCount -
            guild.members.cache.filter((m) => m.user.bot).size
          } humans\n**• Bots:** ${
            guild.members.cache.filter((m) => m.user.bot).size
          } bots\n**• Total Members:** ${
            guild.memberCount
          } members\n**• Boost Count:** ${
            guild.premiumSubscriptionCount
          } boosts\n**• Shard:** ${guild.shard.id}`,
          inline: true,
        },
        {
          name: "Server Information 2",
          value: `**• Name Acronym:** ${
            guild.nameAcronym
          }\n**• Icon URL:** [Link](${guild.iconURL({
            size: 4096,
          })})\n**• Large Server:** ${
            guild.large ? "Yes" : "No"
          }\n**• AFK Channel:** ${
            guild.afkChannel === null ? "None" : guild.afkChannel
          }\n**• AFK Channel ID:** ${
            guild.afkChannelId === null ? "None" : guild.afkChannelId
          }\n**• AFK Timeout:** ${
            guild.afkTimeout
          } Seconds\n**• Default Message Notifications:** ${
            guild.defaultMessageNotifications
          }\n**• Server Description:** ${
            guild.description === null ? "None" : guild.description
          }\n**• Explicit Content Filter:** ${
            verlvl2[guild.explicitContentFilter]
          }\n**• Verification Level:** ${
            verlvl[guild.verificationLevel]
          }\n**• MFA Level:** ${
            guild.mfaLevel === 0 ? "None" : "High"
          }\n**• Partnered:** ${
            guild.partnered ? "Yes" : "No"
          }\n**• Verified:** ${
            guild.verified ? "Yes" : "No"
          }\n**• Vanity URL Code:** ${
            guild.vanityURLCode === null ? "None" : guild.vanityURLCode
          }`,
          inline: true,
        },
      ])
      .setColor("0ED4DA")
      .setThumbnail(guild.iconURL())
      .setImage(guild.bannerURL({ size: 4096 }))
      .setTimestamp()
      .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

    if (message.guild.features.size > 0) {
      embed.addFields([
        {
          name: `Server Features [${guild.premiumTier}]`,
          value: `${message.guild.features
            .map((f) => `**• ${f}**`)
            .join("\n")}`,
        },
      ]);
    }

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "serverinfo",
      description: "Get information about the server.",
      type: 1,
    },
    run: async (client, interaction) => {
      const verlvl = {
        0: "None",
        1: "Low",
        2: "Medium",
        3: "(╯°□°）╯︵ ┻━┻",
        4: "(ノಠ益ಠ)ノ彡┻━┻",
      };
      const verlvl2 = {
        0: "Disabled",
        1: "Apply To Members Without Roles Only",
        2: "Apply To All Members",
      };

      const guild = await client.guilds.fetch(interaction.guild.id);

      const created = utils.formatDate(interaction.guild.createdAt);

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(guild.name)
        .addFields([
          {
            name: "Server Information 1",
            value: `**• Name:** ${guild.name}\n**• ID:** ${
              guild.id
            }\n**• Owner:** ${guild.members.cache.get(
              guild.ownerId
            )}\n**• Owner ID:** ${
              guild.ownerId
            }\n**• Created At:** ${created}\n**• Text Channels:** ${
              guild.channels.cache.filter(
                (c) => c.type === Discord.ChannelType.GuildText
              ).size
            } channels\n**• Voice Channels:** ${
              guild.channels.cache.filter(
                (c) => c.type === Discord.ChannelType.GuildVoice
              ).size
            } channels\n**• Roles:** ${
              guild.roles.cache.size
            } roles\n**• Emojis:** ${
              guild.emojis.cache.size
            } emojis\n**• Stickers:** ${
              guild.stickers.cache.size
            } stickers\n**• Humans:** ${
              guild.memberCount -
              guild.members.cache.filter((m) => m.user.bot).size
            } humans\n**• Bots:** ${
              guild.members.cache.filter((m) => m.user.bot).size
            } bots\n**• Total Members:** ${
              guild.memberCount
            } members\n**• Boost Count:** ${
              guild.premiumSubscriptionCount
            } boosts\n**• Shard:** ${guild.shard.id}`,
            inline: true,
          },
          {
            name: "Server Information 2",
            value: `**• Name Acronym:** ${
              guild.nameAcronym
            }\n**• Icon URL:** [Link](${guild.iconURL({
              size: 4096,
            })})\n**• Large Server:** ${
              guild.large ? "Yes" : "No"
            }\n**• AFK Channel:** ${
              guild.afkChannel === null ? "None" : guild.afkChannel
            }\n**• AFK Channel ID:** ${
              guild.afkChannelId === null ? "None" : guild.afkChannelId
            }\n**• AFK Timeout:** ${
              guild.afkTimeout
            } Seconds\n**• Default Message Notifications:** ${
              guild.defaultMessageNotifications
            }\n**• Server Description:** ${
              guild.description === null ? "None" : guild.description
            }\n**• Explicit Content Filter:** ${
              verlvl2[guild.explicitContentFilter]
            }\n**• Verification Level:** ${
              verlvl[guild.verificationLevel]
            }\n**• MFA Level:** ${
              guild.mfaLevel === 0 ? "None" : "High"
            }\n**• Partnered:** ${
              guild.partnered ? "Yes" : "No"
            }\n**• Verified:** ${
              guild.verified ? "Yes" : "No"
            }\n**• Vanity URL Code:** ${
              guild.vanityURLCode === null ? "None" : guild.vanityURLCode
            }`,
            inline: true,
          },
        ])
        .setColor("0ED4DA")
        .setThumbnail(guild.iconURL())
        .setImage(guild.bannerURL({ size: 4096 }))
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      if (interaction.guild.features.size > 0) {
        embed.addFields([
          {
            name: `Server Features [${guild.premiumTier}]`,
            value: `${interaction.guild.features
              .map((f) => `**• ${f}**`)
              .join("\n")}`,
          },
        ]);
      }

      interaction.reply({ embeds: [embed] });
    },
  },
};
