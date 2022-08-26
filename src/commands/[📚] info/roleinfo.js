const Discord = require("discord.js");
const { argsError } = require("../../utils/errors");
const { getRoleFromArguments } = require("../../utils/getters");

module.exports = {
  name: "roleinfo",
  aliases: ["role"],
  category: "[📚] info",
  description: "Returns role information",
  usage: "<role>",
  run: async (client, message, args) => {
    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    const role = await getRoleFromArguments(message, args.join(" "));

    if (!role) {
      return argsError(module.exports, client, message);
    }

    const guildMembers = await role.guild.members.fetch();
    const memberCount = guildMembers.filter((member) =>
      member.roles.cache.has(role.id)
    ).size;

    let permission;
    const moderatorPermissions = [
      Discord.PermissionsBitField.Flags.KickMembers,
      Discord.PermissionsBitField.Flags.BanMembers,
      Discord.PermissionsBitField.Flags.ManageChannels,
      Discord.PermissionsBitField.Flags.ManageGuild,
      Discord.PermissionsBitField.Flags.ManageMessages,
      Discord.PermissionsBitField.Flags.MuteMembers,
      Discord.PermissionsBitField.Flags.DeafenMembers,
      Discord.PermissionsBitField.Flags.MoveMembers,
      Discord.PermissionsBitField.Flags.ManageNicknames,
      Discord.PermissionsBitField.Flags.ManageRoles,
      Discord.PermissionsBitField.Flags.ManageWebhooks,
      Discord.PermissionsBitField.Flags.ManageEmojisAndStickers,
    ];

    if (role.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
      permission = "Administrator";
    } else if (role.permissions.any(moderatorPermissions, false)) {
      permission = "Moderator";
    } else {
      permission = "Member";
    }

    const status = {
      false: "No",
      true: "Yes",
    };

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle("Role Information")
      .setDescription(
        `**• ID:** ${role.id}\n**• Name:** ${
          role.name
        }\n**• Mention:** ${role}\n**• Hex:** ${role.hexColor.toUpperCase()}\n**• Members with this role:** ${memberCount}\n**• Position:** ${
          role.position
        }\n**• Hoisted status:** ${status[role.hoist]}\n**• Mentionable:** ${
          status[role.mentionable]
        }\n**• Permission:** ${permission}`
      )
      .setColor(role.hexColor)
      .setThumbnail(role.guild.iconURL())
      .setTimestamp()
      .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

    message.reply({ embeds: [embed] });
  },
  interaction: {
    data: {
      name: "roleinfo",
      description: "Returns role information",
      type: 1,
      options: [
        {
          name: "role",
          description: "The role to get information from",
          type: 8,
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      const role = interaction.options.getRole("role");

      const guildMembers = await role.guild.members.fetch();
      const memberCount = guildMembers.filter((member) =>
        member.roles.cache.has(role.id)
      ).size;

      let permission;
      const moderatorPermissions = [
        Discord.PermissionsBitField.Flags.KickMembers,
        Discord.PermissionsBitField.Flags.BanMembers,
        Discord.PermissionsBitField.Flags.ManageChannels,
        Discord.PermissionsBitField.Flags.ManageGuild,
        Discord.PermissionsBitField.Flags.ManageMessages,
        Discord.PermissionsBitField.Flags.MuteMembers,
        Discord.PermissionsBitField.Flags.DeafenMembers,
        Discord.PermissionsBitField.Flags.MoveMembers,
        Discord.PermissionsBitField.Flags.ManageNicknames,
        Discord.PermissionsBitField.Flags.ManageRoles,
        Discord.PermissionsBitField.Flags.ManageWebhooks,
        Discord.PermissionsBitField.Flags.ManageEmojisAndStickers,
      ];

      if (
        role.permissions.has(Discord.PermissionsBitField.Flags.Administrator)
      ) {
        permission = "Administrator";
      } else if (role.permissions.any(moderatorPermissions, false)) {
        permission = "Moderator";
      } else {
        permission = "Member";
      }

      const status = {
        false: "No",
        true: "Yes",
      };

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Role Information")
        .setDescription(
          `**• ID:** ${role.id}\n**• Name:** ${
            role.name
          }\n**• Mention:** ${role}\n**• Hex:** ${role.hexColor.toUpperCase()}\n**• Members with this role:** ${memberCount}\n**• Position:** ${
            role.position
          }\n**• Hoisted status:** ${status[role.hoist]}\n**• Mentionable:** ${
            status[role.mentionable]
          }\n**• Permission:** ${permission}`
        )
        .setColor(role.hexColor)
        .setThumbnail(role.guild.iconURL())
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      interaction.reply({ embeds: [embed] });
    },
  },
};
