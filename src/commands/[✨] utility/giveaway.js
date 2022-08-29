const ms = require("ms");
const Discord = require("discord.js");
const { startCollector } = require("../../utils/collectors");
const { getChannelFromArguments } = require("../../utils/getters");
const { ChannelType } = require("discord.js");
const Giveaway = require("../../utils/giveaway");

module.exports = {
  name: "giveaway",
  aliases: ["giveaways"],
  category: "[✨] utility",
  description: "Set up a giveaway on your server",
  memberPermission: "ManageChannels",
  usage: "<start | end | reroll",
  run: async (client, message, args) => {
    if (!(args[0] && args[1])) {
      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: `${client.user.username}'s giveaway commands`,
          iconURL: client.user.avatarURL(),
        })
        .setColor("#CD1C6C")
        .setDescription(
          `**Proper Usage:**\n• ${client.prefixes.get(
            message.guild.id
          )}giveaway start \`<channel>\`\n• ${client.prefixes.get(
            message.guild.id
          )}giveaway end \`<channel> [message ID]\`\n• ${client.prefixes.get(
            message.guild.id
          )}giveaway reroll \`<channel> [message ID]\``
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (args[0].toLowerCase() === "start") {
      let giveawayChannel = "None";
      let giveawayDuration = "None";
      let numberOfWinners = "None";
      let giveawayPrize = "None";

      const channel = await getChannelFromArguments(message, args[1]);

      if (!channel) {
        return message.channel.send(
          "I didn't found any channel with that name."
        );
      }

      if (
        !message.guild.members.me
          .permissionsIn(channel)
          .has(Discord.PermissionsBitField.Flags.SendMessages)
      ) {
        return message.channel.send(
          "I do not have a permission to send a message in that channel."
        );
      }

      giveawayChannel = channel;

      const example = new Discord.EmbedBuilder()
        .setDescription("ㅤ")
        .addFields([{ name: "Channel", value: channel.toString() }]);

      let content =
        "Please provide a duration how long it would be.(example:`10m`, `1h`, `2.5h`, `1d`)\n\nType `stop` if you want to stop.";

      const m = await message.reply({ content, embeds: [example] });

      const giveawayDurationinput = await startCollector(message);

      if (giveawayDurationinput.error === "stop") {
        return message.channel.send("I have stopped the command");
      } else {
        if (isNaN(ms(giveawayDurationinput.message))) {
          return message.channel.send("Invalid Input");
        }

        giveawayDuration = giveawayDurationinput.message;

        example.addFields([{ name: "Duration", value: `${giveawayDuration}` }]);
      }

      content =
        "How many winners would it be?\n\nType `stop` if you want to stop.";

      m.edit({ content, embeds: [example] });

      const numberOfWinnersInput = await startCollector(message);

      if (numberOfWinnersInput.error === "stop") {
        return message.channel.send("I have stopped the command");
      } else {
        if (
          isNaN(numberOfWinnersInput.message) ||
          parseInt(numberOfWinnersInput.message < 1)
        ) {
          return message.channel.send("Invalid input.");
        }

        numberOfWinners = parseInt(numberOfWinnersInput.message);

        example.addFields([
          {
            name: "Number Of Winners",
            value: `${numberOfWinners}`,
          },
        ]);
      }

      content =
        "What is the prize of the giveaway?\n\nType `stop` if you want to stop.";

      m.edit({ content, embeds: [example] });

      const giveawayPrizeInput = await startCollector(message);

      if (giveawayPrizeInput.error === "stop") {
        return message.channel.send("I have stopped the command");
      } else {
        giveawayPrize = giveawayPrizeInput.message;

        example.addFields([{ name: "Prize", value: `${giveawayPrize}` }]);
      }

      content = "Is this okay? (yes or no)";

      m.edit({ content, embeds: [example] });

      const confirm = await startCollector(message);

      if (confirm.message === "yes") {
        new Giveaway(client).start({
          channel: giveawayChannel,
          duration: ms(giveawayDuration),
          winnerCount: numberOfWinners,
          prize: giveawayPrize,
          host: message.author,
        });

        message.reply(`Giveaway started in ${giveawayChannel}!`);
      } else {
        return message.channel.send("I have stopped the command.");
      }
    } else if (args[0].toLowerCase() === "end") {
      if (!args[1]) {
        return message.channel.send("Please provide a channel name.");
      }
      const channel = await getChannelFromArguments(message, args[1]);

      if (args[2]) {
        new Giveaway(client).stop(channel, args[2]);
      } else {
        new Giveaway(client).stop(channel);
      }
    } else if (args[0].toLowerCase() === "reroll") {
      if (!args[1]) {
        return message.channel.send("Please provide a channel name.");
      }
      const channel = await getChannelFromArguments(message, args[1]);

      if (args[2]) {
        new Giveaway(client).reroll(channel, args[2]);
      } else {
        new Giveaway(client).reroll(channel);
      }
    }
  },
  interaction: {
    data: {
      name: "giveaway",
      description: "Create a giveaway",
      type: 1,
      default_member_permissions:
        Discord.PermissionsBitField.Flags.ManageChannels.toString(),
      options: [
        {
          name: "create",
          description: "Create a giveaway",
          type: 1,
          options: [
            {
              name: "duration",
              description: "Duration of the giveaway",
              type: 3,
              required: true,
            },
            {
              name: "prize",
              description: "Prize of the giveaway",
              type: 3,
              required: true,
            },
            {
              name: "channel",
              description: "Channel of the giveaway",
              type: 7,
              required: true,
              channel_types: [ChannelType.GuildText],
            },
            {
              name: "winners",
              description: "Number of winners of the giveaway",
              type: 4,
              required: true,
            },
          ],
        },
        {
          name: "end",
          description: "End a giveaway",
          type: 1,
          options: [
            {
              name: "channel",
              description: "channel of the giveaway",
              type: 7,
              required: true,
            },
            {
              name: "message_id",
              description: "message id of the giveaway",
              type: 3,
            },
          ],
        },
        {
          name: "reroll",
          description: "Reroll a giveaway",
          type: 1,
          options: [
            {
              name: "channel",
              description: "channel of the giveaway",
              type: 7,
              required: true,
            },
            {
              name: "message_id",
              description: "message id of the giveaway",
              type: 3,
            },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "create") {
        const duration = interaction.options.getString("duration");
        const prize = interaction.options.getString("prize");
        const channel = interaction.options.getChannel("channel");
        const winners = interaction.options.getInteger("winners");

        if (isNaN(ms(duration))) {
          return interaction.reply("`duration` - Invalid Input");
        }

        new Giveaway(client).start({
          channel: channel,
          duration: ms(duration),
          winnerCount: winners,
          prize: prize,
          host: interaction.user,
        });

        interaction.reply(`Giveaway started in ${channel}!`);
      } else if (subcommand === "end") {
        const messageId = interaction.options.getString("message_id");
        const channel = interaction.options.getChannel("channel");

        if (messageId) {
          new Giveaway(client).stop(channel, messageId);
        } else {
          new Giveaway(client).stop(channel);
        }

        interaction.reply({
          content: `Giveaway stopped in ${channel}!`,
          ephemeral: true,
        });
      } else {
        const messageId = interaction.options.getString("message_id");
        const channel = interaction.options.getChannel("channel");

        if (messageId) {
          new Giveaway(client).reroll(channel, messageId);
        } else {
          new Giveaway(client).reroll(channel);
        }

        interaction.reply({
          content: `Giveaway rerolled in ${channel}!`,
          ephemeral: true,
        });
      }
    },
  },
};
