const { startCollector } = require("../../utils/collectors");
const { getChannelFromArguments } = require("../../utils/getters");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { argsError } = require("../../utils/errors");
const Color = require("color");
const { checkIfImage } = require("../../utils/utils");
const validURL = require("valid-url");

module.exports = {
  name: "announce",
  category: "utility",
  description: "Sends an announcement to the channel",
  memberPermission: "ManageChannels",
  usage: "<channel>",
  run: async (client, message, args) => {
    if (!args[0]) {
      return argsError(module.exports, client, message);
    }

    const channel = await getChannelFromArguments(message, args.join(" "));

    if (!channel) {
      return message.reply("Sorry, I couldn't find this channel.");
    }

    if (
      !message.guild.members.me
        .permissionsIn(channel)
        .has(PermissionsBitField.Flags.SendMessages)
    ) {
      return message.reply(
        "I do not have permission in that channel to send an announcement."
      );
    }

    const embed = new EmbedBuilder().setDescription("ㅤ");
    let content = `please provide a name for author slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

    const m = await message.reply({
      content,
      embeds: [embed],
    });

    const authorName = await startCollector(message, 256);

    if (authorName.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (authorName.error !== "skip") {
      if (authorName.error) {
        return message.reply(`Error: ${authorName.error}`);
      }

      embed.setAuthor({ name: authorName.message });
      content = `please provide a url or attachment for author iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

      m.edit({
        content,
        embeds: [embed],
      });

      const authorIconURL = await startCollector(message);

      if (authorIconURL.error === "stop") {
        return message.reply("I have stopped the command.");
      }

      if (authorIconURL.error !== "skip") {
        if (authorIconURL.attachment) {
          if (!(await checkIfImage(authorIconURL.attachment))) {
            return message.reply("That's not an image.");
          }

          embed.setAuthor({
            name: authorName.message,
            iconURL: authorIconURL.attachment,
          });
        } else {
          let authorIconURLText = authorIconURL.message;

          switch (authorIconURL.message) {
            case "{user avatar}": {
              authorIconURLText = message.author.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              authorIconURLText = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              authorIconURLText = message.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(authorIconURLText))) {
            return message.reply("That's not an image.");
          }

          embed.setAuthor({
            name: authorName.message,
            iconURL: authorIconURLText,
          });
        }
      }
    }

    content = `please provide a title for title slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const title = await startCollector(message, 256);

    if (title.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (title.error !== "skip") {
      if (title.error) {
        return message.reply(`"Error: ${title.error}`);
      }

      embed.setTitle(title.message);

      content = `please provide an URL for URL slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

      m.edit({
        content,
        embeds: [embed],
      });

      const url = await startCollector(message);

      if (url.error === "stop") {
        return message.reply("I have stopped the command.");
      }

      if (url.error !== "skip") {
        if (!validURL.isUri(url.message)) {
          return message.channel.send(
            "Not a well formed URL. I have stopped the command."
          );
        }

        embed.setURL(url.message);
      }
    }

    content = `please provide a description for description slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const description = await startCollector(message, 2048);

    if (description.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (description.error !== "skip") {
      if (description.error) {
        return message.reply(`Error : ${description.error}`);
      }

      embed.setDescription(description.message);
    }

    content = `please provide a text for footer slot, \`skip\` to skip. \`stop\` to stop.\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const footerText = await startCollector(message, 2048);

    if (footerText.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (footerText.error !== "skip") {
      if (footerText.error) {
        return message.reply(`Error: ${footerText.error}`);
      }

      embed.setFooter({ text: footerText.message });

      content = `please provide a url or attachment for footer iconURL slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

      m.edit({
        content,
        embeds: [embed],
      });

      const footerIconURL = await startCollector(message);

      if (footerIconURL.error === "stop") {
        return message.reply("I have stopped the command.");
      }

      if (footerIconURL.error !== "skip") {
        if (footerIconURL.attachment) {
          if (!(await checkIfImage(footerIconURL.attachment))) {
            return message.reply("That's not an image.");
          }

          embed.setFooter({
            text: footerText.message,
            iconURL: footerIconURL.attachment,
          });
        } else {
          let footerIconURLText = footerIconURL.message;

          switch (footerIconURL.message) {
            case "{user avatar}": {
              footerIconURLText = message.author.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              footerIconURLText = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              footerIconURLText = message.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(footerIconURLText))) {
            return message.reply("That's not an image.");
          }

          embed.setFooter({
            text: footerText.message,
            iconURL: footerIconURLText,
          });
        }
      }
    }

    content = `please provide a url or attachment for thumbnail slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const thumbnail = await startCollector(message);

    if (thumbnail.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (thumbnail.error !== "skip") {
      if (thumbnail.attachment) {
        if (!(await checkIfImage(thumbnail.attachment))) {
          return message.reply("That's not an image.");
        }

        embed.setThumbnail(thumbnail.attachment);
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
          return message.reply("That's not an image.");
        }

        embed.setThumbnail(thumbnailText);
      }
    }

    content = `please provide a url or attachment for image slot,\n\`skip\` to skip.\n\`stop\` to stop.\n\`{user avatar}\` - your avatar\n\`{jasmine avatar}\` - avatar of jasmine\n\`{server icon}\` - the icon of this server\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const image = await startCollector(message);

    if (image.error === "stop") {
      return message.reply("I have stopped the command.");
    }

    if (image.error !== "skip") {
      if (image.attachment) {
        if (!(await checkIfImage(image.attachment))) {
          return message.reply("That's not an image.");
        }

        embed.setImage(image.attachment);
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
          return message.reply("That's not an image.");
        }

        embed.setImage(imageText);
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
    }

    content = `Is this okay? \`yes\` or \`no\`.\nchannel: ${channel}`;

    m.edit({
      content,
      embeds: [embed],
    });

    const confirmation = await startCollector(message);

    if (confirmation.message === "yes") {
      m.delete();
      channel.send({ embeds: [embed] });

      message.channel.send("I have posted your announcement!");
    } else {
      message.channel.send("I have stopped the command.");
    }
  },
  interaction: {
    data: {
      name: "announce",
      type: 1,
      description: "Announce a message to a channel",
      default_member_permissions:
        PermissionsBitField.Flags.ManageChannels.toString(),
      options: [
        {
          name: "channel",
          type: 7,
          description: "The channel to announce to",
          required: true,
          channel_types: [0],
        },
        {
          name: "author_text",
          type: 3,
          description: "The text to use for the author",
        },
        {
          name: "author_icon",
          type: 3,
          description: "The icon to use for the author",
        },
        {
          name: "title",
          type: 3,
          description: "The title of the embed",
        },
        {
          name: "url",
          type: 3,
          description: "The url of the embed",
        },
        {
          name: "description",
          type: 3,
          description: "The description of the embed",
        },
        {
          name: "thumbnail",
          type: 3,
          description: "The thumbnail of the embed",
        },
        {
          name: "image",
          type: 3,
          description: "The image of the embed",
        },
        {
          name: "color",
          type: 3,
          description: "The color of the embed",
        },
        {
          name: "footer_text",
          type: 3,
          description: "The text of the footer",
        },
        {
          name: "footer_icon",
          type: 3,
          description: "The icon of the footer",
        },
      ],
    },
    run: async (client, interaction) => {
      const channel = interaction.options.getChannel("channel");
      const authorText = interaction.options.getString("author_text");
      let authorIcon = interaction.options.getString("author_icon");
      const title = interaction.options.getString("title");
      const url = interaction.options.getString("url");
      const description = interaction.options.getString("description");
      let thumbnail = interaction.options.getString("thumbnail");
      let image = interaction.options.getString("image");
      const color = interaction.options.getString("color");
      const footerText = interaction.options.getString("footer_text");
      let footerIcon = interaction.options.getString("footer_icon");

      const embed = new EmbedBuilder();

      if (authorText) {
        embed.setAuthor({ name: authorText });

        if (authorIcon) {
          switch (authorIcon) {
            case "{user avatar}": {
              authorIcon = interaction.user.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              authorIcon = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              authorIcon = interaction.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(authorIcon))) {
            return interaction.reply("`author_icon` input is not an image.");
          }

          embed.setAuthor({ name: authorText, iconURL: authorIcon });
        }
      }

      if (title) {
        embed.setTitle(title);

        if (url) {
          if (!validURL.isUri(url)) {
            return interaction.reply("`url` input is not a valid url.");
          }

          embed.setURL(url);
        }
      }

      if (description) {
        embed.setDescription(description);
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
          return interaction.reply("`thumbnail` input is not an image.");
        }

        embed.setThumbnail(thumbnail);
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
          return interaction.reply("`image` input is not an image.");
        }

        embed.setImage(image);
      }

      if (color) {
        const hexColor = Color(color.toLowerCase()).hex();

        embed.setColor(hexColor);
      }

      if (footerText) {
        embed.setFooter({ text: footerText });

        if (footerIcon) {
          switch (footerIcon) {
            case "{user avatar}": {
              footerIcon = interaction.user.displayAvatarURL();
              break;
            }
            case "{jasmine avatar}": {
              footerIcon = client.user.displayAvatarURL();
              break;
            }
            case "{server icon}": {
              footerIcon = interaction.guild.iconURL();
              break;
            }
          }

          if (!(await checkIfImage(footerIcon))) {
            return interaction.reply("`footer_icon` input is not an image.");
          }

          embed.setFooter({ text: footerText, iconURL: footerIcon });
        }
      }

      channel.send({ embeds: [embed] });

      interaction.reply("I have posted your announcement!");
    },
  },
};
