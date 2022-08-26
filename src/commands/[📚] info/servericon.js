const Discord = require("discord.js");
const Paginate = require("../../utils/pagination");

module.exports = {
  name: "servericon",
  aliases: ["si"],
  category: "[📚] info",
  description: "Returns server icon",
  run: (client, message) => {
    if (!message.guild.iconURL()) {
      return message.reply("This server doesn't have a server icon");
    }

    const pages = [];

    const iconEmbed = new Discord.EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle("Server Icon")
      .setColor("#CD1C6C")
      .setDescription(
        `[webp](${message.guild.iconURL({
          format: "webp",
          size: 4096,
        })}) | [png](${message.guild.iconURL({
          format: "png",
          size: 4096,
        })}) | [jpg](${message.guild.iconURL({
          format: "jpg",
          size: 4096,
        })}) | [jpeg](${message.guild.iconURL({
          format: "jpeg",
          size: 4096,
        })}) | [gif](${message.guild.iconURL({
          size: 4096,
          format: "gif",
        })})`
      )
      .setImage(message.guild.iconURL({ size: 4096 }))
      .setTimestamp()
      .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

    pages.push(iconEmbed);

    if (message.guild.splashURL()) {
      const splashEmbed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("Server Splash")
        .setColor("#CD1C6C")
        .setImage(message.guild.splashURL({ size: 4096 }))
        .setDescription(
          `[webp](${message.guild.splashURL({
            format: "webp",
            size: 4096,
          })}) | [png](${message.guild.splashURL({
            format: "png",
            size: 4096,
          })}) | [jpg](${message.guild.splashURL({
            format: "jpg",
            size: 4096,
          })}) | [jpeg](${message.guild.splashURL({
            format: "jpeg",
            size: 4096,
          })}) | [gif](${message.guild.splashURL({
            size: 4096,
            format: "gif",
          })})`
        )
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      pages.push(splashEmbed);
    }

    if (message.guild.bannerURL()) {
      const bannerEmbed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("Server Banner")
        .setColor("#CD1C6C")
        .setImage(message.guild.bannerURL({ size: 4096 }))
        .setDescription(
          `[webp](${message.guild.bannerURL({
            format: "webp",
            size: 4096,
          })}) | [png](${message.guild.bannerURL({
            format: "png",
            size: 4096,
          })}) | [jpg](${message.guild.bannerURL({
            format: "jpg",
            size: 4096,
          })}) | [jpeg](${message.guild.bannerURL({
            format: "jpeg",
            size: 4096,
          })}) | [gif](${message.guild.bannerURL({
            size: 4096,
            format: "gif",
          })})`
        )
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      pages.push(bannerEmbed);
    }

    if (message.guild.discoverySplashURL()) {
      const discoverySplashEmbed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("Server Splash (Discovery)")
        .setColor("#CD1C6C")
        .setImage(message.guild.discoverySplashURL({ size: 4096 }))
        .setDescription(
          `[webp](${message.guild.discoverySplashURL({
            format: "webp",
            size: 4096,
          })}) | [png](${message.guild.discoverySplashURL({
            format: "png",
            size: 4096,
          })}) | [jpg](${message.guild.discoverySplashURL({
            format: "jpg",
            size: 4096,
          })}) | [jpeg](${message.guild.discoverySplashURL({
            format: "jpeg",
            size: 4096,
          })}) | [gif](${message.guild.discoverySplashURL({
            size: 4096,
            format: "gif",
          })})`
        )
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      pages.push(discoverySplashEmbed);
    }

    new Paginate.Paginate(client, message, pages).init();
  },
  interaction: {
    data: {
      name: "servericon",
      description: "View the server icon.",
      type: 1,
    },
    run: async (client, interaction) => {
      if (!interaction.guild.iconURL()) {
        return interaction.reply("This server doesn't have a server icon");
      }

      const pages = [];

      const iconEmbed = new Discord.EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Server Icon")
        .setColor("#CD1C6C")
        .setDescription(
          `[webp](${interaction.guild.iconURL({
            format: "webp",
            size: 4096,
          })}) | [png](${interaction.guild.iconURL({
            format: "png",
            size: 4096,
          })}) | [jpg](${interaction.guild.iconURL({
            format: "jpg",
            size: 4096,
          })}) | [jpeg](${interaction.guild.iconURL({
            format: "jpeg",
            size: 4096,
          })}) | [gif](${interaction.guild.iconURL({
            size: 4096,
            format: "gif",
          })})`
        )
        .setImage(interaction.guild.iconURL({ size: 4096 }))
        .setTimestamp()
        .setFooter({ text: client.user.tag, iconURL: client.user.avatarURL() });

      pages.push(iconEmbed);

      if (interaction.guild.splashURL()) {
        const splashEmbed = new Discord.EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle("Server Splash")
          .setColor("#CD1C6C")
          .setImage(interaction.guild.splashURL({ size: 4096 }))
          .setDescription(
            `[webp](${interaction.guild.splashURL({
              format: "webp",
              size: 4096,
            })}) | [png](${interaction.guild.splashURL({
              format: "png",
              size: 4096,
            })}) | [jpg](${interaction.guild.splashURL({
              format: "jpg",
              size: 4096,
            })}) | [jpeg](${interaction.guild.splashURL({
              format: "jpeg",
              size: 4096,
            })}) | [gif](${interaction.guild.splashURL({
              size: 4096,
              format: "gif",
            })})`
          )
          .setTimestamp()
          .setFooter({
            text: client.user.tag,
            iconURL: client.user.avatarURL(),
          });

        pages.push(splashEmbed);
      }

      if (interaction.guild.bannerURL()) {
        const bannerEmbed = new Discord.EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle("Server Banner")
          .setColor("#CD1C6C")
          .setImage(interaction.guild.bannerURL({ size: 4096 }))
          .setDescription(
            `[webp](${interaction.guild.bannerURL({
              format: "webp",
              size: 4096,
            })}) | [png](${interaction.guild.bannerURL({
              format: "png",
              size: 4096,
            })}) | [jpg](${interaction.guild.bannerURL({
              format: "jpg",
              size: 4096,
            })}) | [jpeg](${interaction.guild.bannerURL({
              format: "jpeg",
              size: 4096,
            })}) | [gif](${interaction.guild.bannerURL({
              size: 4096,
              format: "gif",
            })})`
          )
          .setTimestamp()
          .setFooter({
            text: client.user.tag,
            iconURL: client.user.avatarURL(),
          });

        pages.push(bannerEmbed);
      }

      if (interaction.guild.discoverySplashURL()) {
        const discoverySplashEmbed = new Discord.EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle("Server Splash (Discovery)")
          .setColor("#CD1C6C")
          .setImage(interaction.guild.discoverySplashURL({ size: 4096 }))
          .setDescription(
            `[webp](${interaction.guild.discoverySplashURL({
              format: "webp",
              size: 4096,
            })}) | [png](${interaction.guild.discoverySplashURL({
              format: "png",
              size: 4096,
            })}) | [jpg](${interaction.guild.discoverySplashURL({
              format: "jpg",
              size: 4096,
            })}) | [jpeg](${interaction.guild.discoverySplashURL({
              format: "jpeg",
              size: 4096,
            })}) | [gif](${interaction.guild.discoverySplashURL({
              size: 4096,
              format: "gif",
            })})`
          )
          .setTimestamp()
          .setFooter({
            text: client.user.tag,
            iconURL: client.user.avatarURL(),
          });

        pages.push(discoverySplashEmbed);
      }

      new Paginate.Paginate(client, interaction, pages).init();
    },
  },
};
