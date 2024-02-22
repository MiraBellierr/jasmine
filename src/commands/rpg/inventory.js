const schemas = require("../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../utils/constants");
const equipments = require("../../database/json/equipments.json");
const { camelCaseToNormal } = require("../../utils/utils");

module.exports = {
  name: "inventory",
  aliases: ["inv"],
  description: "View your inventory",
  category: "rpg",
  run: async (client, message) => {
    const character = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!character) {
      return message.reply(
        `You are not registered yet. Please type \`${client.prefixes.get(
          message.guild.id,
        )}register <class>\` to register`,
      );
    }

    const weapons = JSON.parse(character.get("equipments")).weapons.inventory;
    const shields = JSON.parse(character.get("equipments")).shields.inventory;
    const helmet = JSON.parse(character.get("equipments")).helmet.inventory;
    const armor = JSON.parse(character.get("equipments")).armor.inventory;
    const gloves = JSON.parse(character.get("equipments")).gloves.inventory;

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("equipments")
        .setPlaceholder("Nothing Selected")
        .addOptions(
          {
            label: "Weapons",
            description: "List of Weapons",
            value: "weapons",
            emoji: constants.assets.weapon.emoji,
          },
          {
            label: "Shields",
            description: "List of Shields",
            value: "shields",
            emoji: constants.assets.shield.emoji,
          },
          {
            label: "Helmet",
            description: "List of Helmet",
            value: "helmet",
            emoji: constants.assets.helmet.emoji,
          },
          {
            label: "Armor",
            description: "List of Armor",
            value: "armor",
            emoji: constants.assets.armor.emoji,
          },
          {
            label: "Gloves",
            description: "List of Gloves",
            value: "gloves",
            emoji: constants.assets.gloves.emoji,
          },
        ),
    );

    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle("Inventory")
      .setDescription("> Please select a category below!")
      .setColor("#0099ff")
      .setThumbnail("https://miraiscute.com/assets/146.png")
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    const m = await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    collector();

    function collector() {
      const filter = (interaction) => interaction.user.id === message.author.id;

      m.awaitMessageComponent({
        filter,
        time: 15_000,
      }).then(
        (interaction) => {
          if (interaction.values.includes("weapons")) {
            let weaponsText = [];

            weapons.forEach((weapon) => {
              const w = equipments.weapons[weapon].attr;

              let attr = [];

              Object.keys(w).forEach((a) => attr.push(`${a}:${w[a]}`));

              weaponsText.push(
                `• **${camelCaseToNormal(weapon)}** - \`${attr.join("|")}\``,
              );
            });

            if (weaponsText.length === 0) {
              weaponsText = ["Nothing to show"];
            }

            const weaponsEmbed = new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle("Weapons")
              .setDescription(weaponsText.join("\n"))
              .setColor("#0099ff")
              .setThumbnail("https://miraiscute.com/assets/146.png")
              .setFooter({
                text: `To buy, type ${client.prefixes.get(
                  message.guild.id,
                )}buy <name>`,
                iconURL: client.user.displayAvatarURL(),
              });

            interaction.update({
              embeds: [weaponsEmbed],
            });

            collector();
          }

          if (interaction.values.includes("shields")) {
            let shieldsText = [];

            shields.forEach((shield) => {
              const s = equipments.shields[shield].attr;

              let attr = [];

              Object.keys(s).forEach((a) => attr.push(`${a}:${s[a]}`));

              shieldsText.push(
                `• ${camelCaseToNormal(shield)} - \`${attr.join("|")}\``,
              );
            });

            if (shieldsText.length === 0) {
              shieldsText = ["Nothing to show"];
            }

            const shieldsEmbed = new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle("Shields")
              .setDescription(shieldsText.join("\n"))
              .setColor("#0099ff")
              .setThumbnail("https://miraiscute.com/assets/146.png")
              .setFooter({
                text: `To buy, type ${client.prefixes.get(
                  message.guild.id,
                )}buy <name>`,
                iconURL: client.user.displayAvatarURL(),
              });

            interaction.update({
              embeds: [shieldsEmbed],
            });

            collector();
          }

          if (interaction.values.includes("helmet")) {
            let helmetText = [];

            helmet.forEach((helmet) => {
              const h = equipments.helmet[helmet].attr;

              let attr = [];

              Object.keys(h).forEach((a) => attr.push(`${a}:${h[a]}`));

              helmetText.push(
                `• ${camelCaseToNormal(helmet)} - \`${attr.join("|")}\``,
              );
            });

            if (helmetText.length === 0) {
              helmetText = ["Nothing to show"];
            }

            const helmetEmbed = new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle("Helmet")
              .setDescription(helmetText.join("\n"))
              .setColor("#0099ff")
              .setThumbnail("https://miraiscute.com/assets/146.png")
              .setFooter({
                text: `To buy, type ${client.prefixes.get(
                  message.guild.id,
                )}buy <name>`,
                iconURL: client.user.displayAvatarURL(),
              });

            interaction.update({
              embeds: [helmetEmbed],
            });

            collector();
          }

          if (interaction.values[0] === "armor") {
            let armorText = [];

            armor.forEach((armort) => {
              const a = equipments.armor[armort].attr;

              let attr = [];

              Object.keys(a).forEach((b) => attr.push(`${b}:${a[b]}`));

              armorText.push(
                `• ${camelCaseToNormal(armort)} - \`${attr.join("|")}\``,
              );
            });

            if (armorText.length === 0) {
              armorText = [["Nothing to show"]];
            }

            const armorEmbed = new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle("Armor")
              .setDescription(armorText.join("\n"))
              .setColor("#0099ff")
              .setThumbnail("https://miraiscute.com/assets/146.png")
              .setFooter({
                text: `To buy, type ${client.prefixes.get(
                  message.guild.id,
                )}buy <name>`,
                iconURL: client.user.displayAvatarURL(),
              });

            interaction.update({
              embeds: [armorEmbed],
            });

            collector();
          }

          if (interaction.values.includes("gloves")) {
            let glovesText = [];

            gloves.forEach((glove) => {
              const g = equipments.gloves[glove].attr;

              let attr = [];

              Object.keys(g).forEach((a) => attr.push(`${a}:${g[a]}`));

              glovesText.push(
                `• ${camelCaseToNormal(glove)} - \`${attr.join("|")}\``,
              );
            });

            if (glovesText.length === 0) {
              glovesText = ["Nothing to show"];
            }

            const glovesEmbed = new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTitle("Gloves")
              .setDescription(glovesText.join("\n"))
              .setColor("#0099ff")
              .setThumbnail("https://miraiscute.com/assets/146.png")
              .setFooter({
                text: `To buy, type ${client.prefixes.get(
                  message.guild.id,
                )}buy <name>`,
                iconURL: client.user.displayAvatarURL(),
              });

            interaction.update({
              embeds: [glovesEmbed],
            });

            collector();
          }
        },
        () => null,
      );
    }
  },
  interaction: {
    data: {
      name: "inventory",
      type: 1,
      description: "Show your inventory",
    },
    run: async (client, interaction) => {
      const character = await schemas
        .character()
        .findOne({ where: { userID: interaction.user.id } });

      if (!character) {
        return interaction.reply("You are not registered yet.");
      }

      const weapons = JSON.parse(character.get("equipments")).weapons.inventory;
      const shields = JSON.parse(character.get("equipments")).shields.inventory;
      const helmet = JSON.parse(character.get("equipments")).helmet.inventory;
      const armor = JSON.parse(character.get("equipments")).armor.inventory;
      const gloves = JSON.parse(character.get("equipments")).gloves.inventory;

      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId("equipments")
          .setPlaceholder("Nothing Selected")
          .addOptions(
            {
              label: "Weapons",
              description: "List of Weapons",
              value: "weapons",
              emoji: constants.assets.weapon.emoji,
            },
            {
              label: "Shields",
              description: "List of Shields",
              value: "shields",
              emoji: constants.assets.shield.emoji,
            },
            {
              label: "Helmet",
              description: "List of Helmet",
              value: "helmet",
              emoji: constants.assets.helmet.emoji,
            },
            {
              label: "Armor",
              description: "List of Armor",
              value: "armor",
              emoji: constants.assets.armor.emoji,
            },
            {
              label: "Gloves",
              description: "List of Gloves",
              value: "gloves",
              emoji: constants.assets.gloves.emoji,
            },
          ),
      );

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Inventory")
        .setDescription("> Please select a category below!")
        .setColor("#0099ff")
        .setThumbnail("https://miraiscute.com/assets/146.png")
        .setFooter({
          text: client.user.username,
          iconURL: client.user.displayAvatarURL(),
        });

      const m = await interaction.reply({
        embeds: [embed],
        components: [row],
      });

      collector();

      function collector() {
        const filter = (i) => i.user.id === interaction.user.id;

        m.awaitMessageComponent({
          filter,
          time: 15_000,
        }).then(
          (interaction) => {
            if (interaction.values.includes("weapons")) {
              let weaponsText = [];

              weapons.forEach((weapon) => {
                const w = equipments.weapons[weapon].attr;

                let attr = [];

                Object.keys(w).forEach((a) => attr.push(`${a}:${w[a]}`));

                weaponsText.push(
                  `• **${camelCaseToNormal(weapon)}** - \`${attr.join("|")}\``,
                );
              });

              if (weaponsText.length === 0) {
                weaponsText = ["Nothing to show"];
              }

              const weaponsEmbed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle("Weapons")
                .setDescription(weaponsText.join("\n"))
                .setColor("#0099ff")
                .setThumbnail("https://miraiscute.com/assets/146.png")
                .setFooter({
                  text: "To buy, use /shop buy <name>",
                  iconURL: client.user.displayAvatarURL(),
                });

              interaction.update({
                embeds: [weaponsEmbed],
              });

              collector();
            }

            if (interaction.values.includes("shields")) {
              let shieldsText = [];

              shields.forEach((shield) => {
                const s = equipments.shields[shield].attr;

                let attr = [];

                Object.keys(s).forEach((a) => attr.push(`${a}:${s[a]}`));

                shieldsText.push(
                  `• ${camelCaseToNormal(shield)} - \`${attr.join("|")}\``,
                );
              });

              if (shieldsText.length === 0) {
                shieldsText = ["Nothing to show"];
              }

              const shieldsEmbed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle("Shields")
                .setDescription(shieldsText.join("\n"))
                .setColor("#0099ff")
                .setThumbnail("https://miraiscute.com/assets/146.png")
                .setFooter({
                  text: "To buy, use /shop buy <name>",
                  iconURL: client.user.displayAvatarURL(),
                });

              interaction.update({
                embeds: [shieldsEmbed],
              });

              collector();
            }

            if (interaction.values.includes("helmet")) {
              let helmetText = [];

              helmet.forEach((helmet) => {
                const h = equipments.helmet[helmet].attr;

                let attr = [];

                Object.keys(h).forEach((a) => attr.push(`${a}:${h[a]}`));

                helmetText.push(
                  `• ${camelCaseToNormal(helmet)} - \`${attr.join("|")}\``,
                );
              });

              if (helmetText.length === 0) {
                helmetText = ["Nothing to show"];
              }

              const helmetEmbed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle("Helmet")
                .setDescription(helmetText.join("\n"))
                .setColor("#0099ff")
                .setThumbnail("https://miraiscute.com/assets/146.png")
                .setFooter({
                  text: "To buy, use /shop buy <name>",
                  iconURL: client.user.displayAvatarURL(),
                });

              interaction.update({
                embeds: [helmetEmbed],
              });

              collector();
            }

            if (interaction.values[0] === "armor") {
              let armorText = [];

              armor.forEach((armort) => {
                const a = equipments.armor[armort].attr;

                let attr = [];

                Object.keys(a).forEach((b) => attr.push(`${b}:${a[b]}`));

                armorText.push(
                  `• ${camelCaseToNormal(armort)} - \`${attr.join("|")}\``,
                );
              });

              if (armorText.length === 0) {
                armorText = [["Nothing to show"]];
              }

              const armorEmbed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle("Armor")
                .setDescription(armorText.join("\n"))
                .setColor("#0099ff")
                .setThumbnail("https://miraiscute.com/assets/146.png")
                .setFooter({
                  text: "To buy, use /shop buy <name>",
                  iconURL: client.user.displayAvatarURL(),
                });

              interaction.update({
                embeds: [armorEmbed],
              });

              collector();
            }

            if (interaction.values.includes("gloves")) {
              let glovesText = [];

              gloves.forEach((glove) => {
                const g = equipments.gloves[glove].attr;

                let attr = [];

                Object.keys(g).forEach((a) => attr.push(`${a}:${g[a]}`));

                glovesText.push(
                  `• ${camelCaseToNormal(glove)} - \`${attr.join("|")}\``,
                );
              });

              if (glovesText.length === 0) {
                glovesText = ["Nothing to show"];
              }

              const glovesEmbed = new Discord.EmbedBuilder()
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle("Gloves")
                .setDescription(glovesText.join("\n"))
                .setColor("#0099ff")
                .setThumbnail("https://miraiscute.com/assets/146.png")
                .setFooter({
                  text: "To buy, use /shop buy <name>",
                  iconURL: client.user.displayAvatarURL(),
                });

              interaction.update({
                embeds: [glovesEmbed],
              });

              collector();
            }
          },
          () => null,
        );
      }
    },
  },
};
