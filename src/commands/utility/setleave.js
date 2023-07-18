const { getChannelFromArguments } = require("../../utils/getters");
const { argsError } = require("../../utils/errors");
const schemas = require("../../database/schemas");
const { startCollector } = require("../../utils/collectors");
const {
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const Color = require("color");
const { checkIfImage } = require("../../utils/utils");
const validURL = require("valid-url");

module.exports = {
  name: "setleave",
  aliases: ["sl"],
  category: "utility",
  description: "Leave message configuration",
  memberPermission: "ManageChannels",
  usage: "<channel | on | off>",
  run: async (client, message, args) => {
    if (!args.length) {
      return argsError(module.exports, client, message);
    }

    const arg = args.join(" ");
    const LeaveMessage = schemas.leaveMessage();

    if (arg === "on") {
      const leaveMessage = await LeaveMessage.findOne({
        where: { guildID: message.guild.id },
      });

      if (!leaveMessage) {
        return message.channel.send("You haven't set up a leave message yet.");
      }

      LeaveMessage.update(
        { switch: true },
        { where: { guildID: message.guild.id } }
      );

      const leaveObj = client.leaves.get(message.guild.id);

      leaveObj.switch = true;

      client.leaves.set(message.guild.id, leaveObj);

      message.channel.send("Leave message has been turned on");
    } else if (arg === "off") {
      const leaveMessage = await LeaveMessage.findOne({
        where: { guildID: message.guild.id },
      });

      if (!leaveMessage) {
        return message.channel.send("You haven't set up a leave message yet.");
      }

      LeaveMessage.update(
        { switch: false },
        { where: { guildID: message.guild.id } }
      );

      const leaveObj = client.leaves.get(message.guild.id);

      leaveObj.switch = false;

      client.leaves.set(message.guild.id, leaveObj);

      message.channel.send("Leave message has been turned off");
    } else {
      const channel = await getChannelFromArguments(message, arg);

      if (!channel) {
        return argsError(module.exports, client, message);
      }

      if (
        !message.guild.members.me
          .permissionsIn(channel)
          .has(PermissionsBitField.Flags.SendMessages)
      ) {
        return message.channel.send(
          "I do not have a permission to send a message in that channel"
        );
      }

      if (channel.type !== ChannelType.GuildText) {
        return message.channel.send("Only guild text channel is accepted");
      }

      const leaveObj = {
        channelID: channel.id,
        switch: false,
        authorName: null,
        authorURL: null,
        title: null,
        titleURL: null,
        thumbnail: null,
        description: null,
        image: null,
        footerText: null,
        footerURL: null,
        color: null,
      };

      const embed = new EmbedBuilder().setDescription("ㅤ");
      let content = `Please provide a name for \`author\` slot\n\`skip\` to skip\n\`stop\` to stop\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nChannel: ${channel}`;

      const m = await message.channel.send({ content, embeds: [embed] });

      const authorName = await startCollector(message, 256);

      if (authorName.error === "stop") {
        return message.channel.send("I have stopped the command");
      }

      if (authorName.error !== "skip") {
        if (authorName.error) {
          return message.channel.send(`Error: ${authorName.error}`);
        }

        const authorNameEmbed = authorName.message
          .replace("{username}", message.author.username)
          .replace("{tag}", message.author.tag)
          .replace("{server}", message.guild.name)
          .replace("{membercount}", message.guild.memberCount);

        embed.setAuthor({ name: authorNameEmbed });

        leaveObj.authorName = authorName.message;

        content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nChannel: ${channel}`;

        m.edit({ content, embeds: [embed] }).catch(() => {
          return message.channel.send("Invalid input");
        });

        const authorURL = await startCollector(message);

        if (authorURL.error === "stop") {
          return message.channel.send("I have stopped the command");
        }

        if (authorURL.error !== "skip") {
          if (authorURL.attachment) {
            if (!(await checkIfImage(authorURL.attachment))) {
              return message.channel.send("Invalid image");
            }

            embed.setAuthor({
              name: authorNameEmbed,
              iconURL: authorURL.attachment,
            });

            leaveObj.authorURL = authorURL.attachment;
          } else {
            let authorURLText = authorURL.message;

            switch (authorURL.message) {
              case "{user avatar}": {
                authorURLText = message.author.displayAvatarURL();
                break;
              }
              case "{jasmine avatar}": {
                authorURLText = client.user.displayAvatarURL();
                break;
              }
              case "{server icon}": {
                authorURLText = message.guild.iconURL();
                break;
              }
            }

            if (!(await checkIfImage(authorURLText))) {
              return message.channel.send("Invalid image");
            }

            embed.setAuthor({
              name: authorNameEmbed,
              iconURL: authorURLText,
            });

            leaveObj.authorURL = authorURL.message;
          }
        }
      }

      content = `please provide a title for title slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count'\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const title = await startCollector(message, 256);

      if (title.error === "stop") {
        return message.channel.send("I have stopped the command");
      }

      if (title.error !== "skip") {
        if (title.error) {
          return message.channel.send(`Error: ${title.error}`);
        }

        const titleEmbed = title.message
          .replace("{username}", message.author.username)
          .replace("{tag}", message.author.tag)
          .replace("{server}", message.guild.name)
          .replace("{membercount}", message.guild.memberCount);

        embed.setTitle(titleEmbed);

        leaveObj.title = title.message;

        content = `please provide an URL for URL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

        m.edit({ content, embeds: [embed] }).catch(() => {
          return message.channel.send("Invalid input");
        });

        const titleURL = await startCollector(message);

        if (titleURL.error === "stop") {
          return message.channel.send("I have stopped the command.");
        }

        if (titleURL.error !== "skip") {
          if (!validURL.isUri(titleURL.message)) {
            return message.channel.send(
              "Not a well formed URL. I have stopped the command."
            );
          }

          embed.setURL(titleURL.message);

          leaveObj.titleURL = titleURL.message;
        }
      }

      content = `please provide a description for description slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{mention}\` - a mention of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const description = await startCollector(message, 2048);

      if (description.error === "stop") {
        return message.channel.send("I have stopped the command.");
      }

      if (description.error !== "skip") {
        if (description.error) {
          return message.channel.send(`Error : ${description.error}`);
        }

        const descriptionEmbed = description.message
          .replace("{username}", message.author.username)
          .replace("{tag}", message.author.tag)
          .replace("{mention}", message.author)
          .replace("{server}", message.guild.name)
          .replace("{membercount}", message.guild.memberCount);

        embed.setDescription(descriptionEmbed);

        leaveObj.description = description.message;
      }

      content = `please provide a text for footer slot, \`skip\` to skip. \`stop\` to stop.\n\`{username}\` - username of the joined member\n\`{tag}\` - user tag of the joined member\n\`{server}\` - your server name\n\`{membercount}\` - your server member count\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const footerText = await startCollector(message, 2048);

      if (footerText.error === "stop") {
        return message.channel.send("I have stopped the command.");
      }

      if (footerText.error !== "skip") {
        if (footerText.error) {
          return message.channel.send(`Error: ${footerText.error}`);
        }

        const footerEmbed = footerText.message
          .replace("{username}", message.author.username)
          .replace("{tag}", message.author.tag)
          .replace("{server}", message.guild.name)
          .replace("{membercount}", message.guild.memberCount);

        embed.setFooter({ text: footerEmbed });

        leaveObj.footerText = footerText.message;

        content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

        m.edit({ content, embeds: [embed] }).catch(() => {
          return message.channel.send("Invalid input");
        });

        const footerURL = await startCollector(message);

        if (footerURL.error === "stop") {
          return message.channel.send("I have stopped the command.");
        }

        if (footerURL.error !== "skip") {
          if (footerURL.attachment) {
            if (!(await checkIfImage(footerURL.attachment))) {
              return message.channel.send(
                "Not a valid image. I have stopped the command."
              );
            }

            embed.setFooter({
              text: footerEmbed,
              iconURL: footerURL.attachment,
            });

            leaveObj.footerURL = footerURL.attachment;
          } else {
            let footerURLText = footerURL.message;

            switch (footerURL.message) {
              case "{user avatar}": {
                footerURLText = message.author.displayAvatarURL();
                break;
              }
              case "{jasmine avatar}": {
                footerURLText = client.user.displayAvatarURL();
                break;
              }
              case "{server icon}": {
                footerURLText = message.guild.iconURL();
                break;
              }
            }

            if (!(await checkIfImage(footerURLText))) {
              return message.channel.send(
                "Not a valid image. I have stopped the command."
              );
            }

            embed.setFooter({
              text: footerEmbed,
              iconURL: footerURLText,
            });

            leaveObj.footerURL = footerURL.message;
          }
        }
      }

      content = `please provide a url or attachment for thumbnail slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const thumbnail = await startCollector(message);

      if (thumbnail.error === "stop") {
        return message.channel.send("I have stopped the command.");
      }

      if (thumbnail.error !== "skip") {
        if (thumbnail.attachment) {
          if (!(await checkIfImage(thumbnail.attachment))) {
            return message.channel.send(
              "Not a valid image. I have stopped the command."
            );
          }

          embed.setThumbnail(thumbnail.attachment);

          leaveObj.thumbnail = thumbnail.attachment;
        } else {
          let thumbnailText = thumbnail.message;

          switch (thumbnail.message) {
            case "{user avatar}": {
              thumbnailText = message.author.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              thumbnailText = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              thumbnailText = message.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(thumbnailText))) {
            return message.channel.send(
              "Not a valid image. I have stopped the command."
            );
          }

          embed.setThumbnail(thumbnailText);

          leaveObj.thumbnail = thumbnail.message;
        }
      }

      content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - avatar of the joined member\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const image = await startCollector(message);

      if (image.error === "stop") {
        return message.channel.send("I have stopped the command.");
      }

      if (image.error !== "skip") {
        if (image.attachment) {
          if (!(await checkIfImage(image.attachment))) {
            return message.channel.send(
              "Not a valid image. I have stopped the command."
            );
          }

          embed.setImage(image.attachment);

          leaveObj.image = image.attachment;
        } else {
          let imageText = image.message;

          switch (image.message) {
            case "{user avatar}": {
              imageText = message.author.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              imageText = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              imageText = message.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(imageText))) {
            return message.channel.send(
              "Not a valid image. I have stopped the command."
            );
          }

          embed.setImage(imageText);

          leaveObj.image = image.message;
        }
      }

      content =
        "What color do you want to use for the embed?\n`skip` to skip\n`stop` to stop";

      m.edit({ content, embeds: [embed] });

      const color = await startCollector(message);

      if (color.error === "stop") {
        return message.channel.send("I have stopped the command");
      }

      if (color.error !== "skip") {
        const hexColor = Color(color.message.toLowerCase()).hex();

        embed.setColor(hexColor);

        leaveObj.color = hexColor;
      }

      content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

      m.edit({ content, embeds: [embed] });

      const confirmation = await startCollector(message);

      if (confirmation.message === "yes") {
        try {
          await LeaveMessage.create({
            guildID: message.guild.id,
            channelID: channel.id,
            switch: false,
            authorName: leaveObj.authorName,
            authorURL: leaveObj.authorURL,
            title: leaveObj.title,
            titleURL: leaveObj.titleURL,
            thumbnail: leaveObj.thumbnail,
            description: leaveObj.description,
            image: leaveObj.image,
            footerText: leaveObj.footerText,
            footerURL: leaveObj.footerURL,
            color: leaveObj.color,
          });
        } catch {
          await LeaveMessage.update(
            {
              channelID: channel.id,
              switch: false,
              authorName: leaveObj.authorName,
              authorURL: leaveObj.authorURL,
              title: leaveObj.title,
              titleURL: leaveObj.titleURL,
              thumbnail: leaveObj.thumbnail,
              description: leaveObj.description,
              image: leaveObj.image,
              footerText: leaveObj.footerText,
              footerURL: leaveObj.footerURL,
              color: leaveObj.color,
            },
            { where: { guildID: message.guild.id } }
          );
        }

        client.leaves.set(message.guild.id, leaveObj);

        message.channel.send(
          `Leave message has been set! Type \`${client.prefixes.get(
            message.guild.id
          )}${module.exports.name} on\` to turn on the leave message`
        );
      } else {
        message.channel.send("I have stopped the command.");
      }
    }
  },
  interaction: {
    data: {
      name: "setleave",
      description: "sets the leave message",
      type: 1,
      default_member_permissions:
        PermissionsBitField.Flags.ManageChannels.toString(),
      options: [
        {
          name: "set",
          description: "creates the leave message",
          type: 1,
          default_member_permissions:
            PermissionsBitField.Flags.ManageChannels.toString(),
          options: [
            {
              name: "channel",
              description: "the channel to send the leave message to",
              type: 7,
              required: true,
              channel_types: [ChannelType.GuildText],
            },

            {
              name: "author_name",
              description: "the author name",
              type: 3,
            },
            {
              name: "author_url",
              description: "the author url",
              type: 3,
            },
            {
              name: "title",
              description: "the title",
              type: 3,
            },
            {
              name: "url",
              description: "the title url",
              type: 3,
            },
            {
              name: "description",
              description: "the description",
              type: 3,
            },
            {
              name: "thumbnail",
              description: "the thumbnail",
              type: 3,
            },
            {
              name: "image",
              description: "the image",
              type: 3,
            },
            {
              name: "footer_text",
              description: "the footer text",
              type: 3,
            },
            {
              name: "footer_url",
              description: "the footer url",
              type: 3,
            },
            {
              name: "color",
              description: "the color",
              type: 3,
            },
          ],
        },
        {
          name: "on",
          description: "turns the leave message on",
          type: 1,
        },
        {
          name: "off",
          description: "turns the leave message off",
          type: 1,
        },
        {
          name: "preview",
          description: "previews the leave message",
          type: 1,
        },
      ],
    },
    run: async (client, interaction) => {
      const arg = interaction.options.getSubcommand();
      const LeaveMessage = schemas.leaveMessage();

      if (arg === "on") {
        const leaveMessage = await LeaveMessage.findOne({
          where: { guildID: interaction.guild.id },
        });

        if (!leaveMessage) {
          return interaction.reply("You haven't set up a leave message yet.");
        }

        LeaveMessage.update(
          { switch: true },
          { where: { guildID: interaction.guild.id } }
        );

        const leaveObj = client.leaves.get(interaction.guild.id);

        leaveObj.switch = true;

        client.leaves.set(interaction.guild.id, leaveObj);

        interaction.reply("Leave message has been turned on");
      } else if (arg === "off") {
        const leaveMessage = await LeaveMessage.findOne({
          where: { guildID: interaction.guild.id },
        });

        if (!leaveMessage) {
          return interaction.reply("You haven't set up a leave message yet.");
        }

        LeaveMessage.update(
          { switch: false },
          { where: { guildID: interaction.guild.id } }
        );

        const leaveObj = client.leaves.get(interaction.guild.id);

        leaveObj.switch = false;

        client.leaves.set(interaction.guild.id, leaveObj);

        interaction.reply("Leave message has been turned off");
      } else if (arg === "preview") {
        const leaveMessage = client.leaves.get(interaction.guild.id);

        if (!leaveMessage) {
          return interaction.reply("You haven't set up a leave message yet.");
        }

        const leaveObj = client.leaves.get(interaction.guild.id);

        const embed = new EmbedBuilder();

        if (leaveObj.authorName) {
          const authorNameEmbed = leaveObj.authorName
            .replace("{username}", interaction.user.username)
            .replace("{tag}", interaction.user.tag)
            .replace("{server}", interaction.guild.name)
            .replace("{membercount}", interaction.guild.memberCount);

          if (leaveObj.authorURL) {
            embed.setAuthor({
              name: authorNameEmbed,
              iconURL: leaveObj.authorURL
                .replace("{user avatar}", interaction.user.displayAvatarURL())
                .replace("{jasmine avatar}", client.user.displayAvatarURL())
                .replace("{server icon}", interaction.guild.iconURL()),
            });
          } else {
            embed.setAuthor({ name: authorNameEmbed });
          }
        }

        if (leaveObj.title) {
          const titleEmbed = leaveObj.title
            .replace("{username}", interaction.user.username)
            .replace("{tag}", interaction.user.tag)
            .replace("{server}", interaction.guild.name)
            .replace("{membercount}", interaction.guild.memberCount);

          embed.setTitle(titleEmbed);

          if (leaveObj.titleURL) {
            embed.setURL(leaveObj.titleURL);
          }
        }

        if (leaveObj.color) {
          embed.setColor(leaveObj.color);
        }

        if (leaveObj.thumbnail) {
          embed.setThumbnail(
            leaveObj.thumbnail
              .replace("{user avatar}", interaction.user.displayAvatarURL())
              .replace("{jasmine avatar}", client.user.displayAvatarURL())
              .replace("{server icon}", interaction.guild.iconURL())
          );
        }

        if (leaveObj.description) {
          const descriptionEmbed = leaveObj.description
            .replace("{username}", interaction.user.username)
            .replace("{tag}", interaction.user.tag)
            .replace("{mention}", interaction.user)
            .replace("{server}", interaction.guild.name)
            .replace("{membercount}", interaction.guild.memberCount);

          embed.setDescription(descriptionEmbed);
        }

        if (leaveObj.image) {
          embed.setImage(
            leaveObj.image
              .replace("{user avatar}", interaction.user.displayAvatarURL())
              .replace("{jasmine avatar}", client.user.displayAvatarURL())
              .replace("{server icon}", interaction.guild.iconURL())
          );
        }

        if (leaveObj.footerText) {
          const footerTextEmbed = leaveObj.footerText
            .replace("{username}", interaction.user.username)
            .replace("{tag}", interaction.user.tag)
            .replace("{server}", interaction.guild.name)
            .replace("{membercount}", interaction.guild.memberCount);

          if (leaveObj.footerURL) {
            embed.setFooter({
              text: footerTextEmbed,
              iconURL: leaveObj.footerURL
                .replace("{user avatar}", interaction.user.displayAvatarURL())
                .replace("{jasmine avatar}", client.user.displayAvatarURL())
                .replace("{server icon}", interaction.guild.iconURL()),
            });
          } else {
            embed.setFooter({ text: footerTextEmbed });
          }
        }

        interaction.reply({ embeds: [embed] });
      } else {
        const channel = interaction.options.getChannel("channel");

        if (
          !interaction.guild.members.me
            .permissionsIn(channel)
            .has(PermissionsBitField.Flags.SendMessages)
        ) {
          return interaction.reply(
            "I do not have a permission to send a message in that channel"
          );
        }

        const leaveObj = {
          channelID: channel.id,
          switch: false,
          authorName: null,
          authorURL: null,
          title: null,
          titleURL: null,
          thumbnail: null,
          description: null,
          image: null,
          footerText: null,
          footerURL: null,
          color: null,
        };

        const authorName = interaction.options.getString("author_name");
        let authorURL = interaction.options.getString("author_url");
        const title = interaction.options.getString("title");
        const titleURL = interaction.options.getString("url");
        let thumbnail = interaction.options.getString("thumbnail");
        const description = interaction.options.getString("description");
        let image = interaction.options.getString("image");
        const footerText = interaction.options.getString("footer_text");
        let footerURL = interaction.options.getString("footer_url");
        const color = interaction.options.getString("color");

        if (authorName) {
          leaveObj.authorName = authorName;

          if (authorURL) {
            switch (authorURL) {
              case "{user avatar}": {
                authorURL = interaction.user.displayAvatarURL();
                break;
              }
              case "{jasmine avatar}": {
                authorURL = client.user.displayAvatarURL();
                break;
              }
              case "{server icon}": {
                authorURL = interaction.guild.iconURL();
                break;
              }
            }

            if (!(await checkIfImage(authorURL))) {
              return interaction.reply("`author_url` - Invalid image");
            }

            leaveObj.authorURL = authorURL.message;
          }
        }

        if (title) {
          leaveObj.title = title;

          if (titleURL) {
            if (!validURL.isUri(titleURL)) {
              return interaction.reply("`url` - Not a well formed URL.");
            }

            leaveObj.titleURL = titleURL.message;
          }
        }

        if (description) {
          leaveObj.description = description;
        }

        if (footerText) {
          leaveObj.footerText = footerText;

          if (footerURL) {
            switch (footerURL) {
              case "{user avatar}": {
                footerURL = interaction.user.displayAvatarURL();
                break;
              }
              case "{jasmine avatar}": {
                footerURL = client.user.displayAvatarURL();
                break;
              }
              case "{server icon}": {
                footerURL = interaction.guild.iconURL();
                break;
              }
            }

            if (!(await checkIfImage(footerURL))) {
              return interaction.reply("`footer_url` - Not a valid image.");
            }

            leaveObj.footerURL = footerURL;
          }
        }

        if (thumbnail) {
          switch (thumbnail) {
            case "{user avatar}": {
              thumbnail = interaction.user.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              thumbnail = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              thumbnail = interaction.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(thumbnail))) {
            return interaction.reply("`thumbnail` - Not a valid image.");
          }

          leaveObj.thumbnail = thumbnail;
        }

        if (image) {
          switch (image) {
            case "{user avatar}": {
              image = interaction.user.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              image = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              image = interaction.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(image))) {
            return interaction.reply("`image` - Not a valid image.");
          }

          leaveObj.image = image;
        }

        if (color) {
          const hexColor = Color(color.toLowerCase()).hex();

          leaveObj.color = hexColor;
        }

        try {
          await LeaveMessage.create({
            guildID: interaction.guild.id,
            channelID: channel.id,
            switch: false,
            authorName: leaveObj.authorName,
            authorURL: leaveObj.authorURL,
            title: leaveObj.title,
            titleURL: leaveObj.titleURL,
            thumbnail: leaveObj.thumbnail,
            description: leaveObj.description,
            image: leaveObj.image,
            footerText: leaveObj.footerText,
            footerURL: leaveObj.footerURL,
            color: leaveObj.color,
          });
        } catch {
          await LeaveMessage.update(
            {
              channelID: channel.id,
              switch: false,
              authorName: leaveObj.authorName,
              authorURL: leaveObj.authorURL,
              title: leaveObj.title,
              titleURL: leaveObj.titleURL,
              thumbnail: leaveObj.thumbnail,
              description: leaveObj.description,
              image: leaveObj.image,
              footerText: leaveObj.footerText,
              footerURL: leaveObj.footerURL,
              color: leaveObj.color,
            },
            { where: { guildID: interaction.guild.id } }
          );
        }

        client.leaves.set(interaction.guild.id, leaveObj);

        interaction.reply("Leave message has been set!");
      }
    },
  },
};
