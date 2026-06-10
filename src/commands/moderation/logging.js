const { EmbedBuilder, Colors } = require("discord.js");
const { Paginate } = require("../../utils/pagination");
const { argsError } = require("../../utils/errors");
const { getChannelFromArguments } = require("../../utils/getters");
const schemas = require("../../database/schemas");
const { deleteElement } = require("../../utils/utils");
const {
  applyDefaultPermission,
  channelOption,
  runPrefixCommand,
  slashCommand,
} = require("../../utils/slashCommands");

const loggingEventOptions = [
  "channelCreation",
  "channelUpdate",
  "channelDeletion",
  "roleCreation",
  "roleUpdate",
  "roleDeletion",
  "serverUpdate",
  "emojiAndStickerChanges",
  "memberRoleChanges",
  "nameChanges",
  "avatarChanges",
  "memberBans",
  "memberUnbans",
  "joinVoice",
  "moveBetweenVoiceChannels",
  "leaveVoice",
  "messageDeletion",
  "messageEdit",
  "messagePurge",
  "discordInvites",
  "memberJoin",
  "memberLeave",
];

const loggingChannelOptions = [
  "defaultLogChannel",
  "memberLogChannel",
  "serverLogChannel",
  "voiceLogChannel",
  "joinLeaveLogChannel",
  "ignoredChannels",
];

const modeChoices = [
  { name: "enable", value: "enable" },
  { name: "disable", value: "disable" },
];

const addChoiceList = (option, choices) =>
  option.addChoices(...choices.map((choice) => ({ name: choice, value: choice })));

module.exports = {
  name: "logging",
  description: "Toggles logging for certain events.",
  category: "moderation",
  clientPermission: "ManageGuild",
  memberPermission: "ManageMessages",
  usage: "<event> <enable|disable> | <channelLogOption> <channel>",
  run: async (client, message, args) => {
    let logging = client.loggings.get(message.guild.id);

    if (!logging) {
      logging = {
        guildID: message.guild.id,
        channelCreation: false,
        channelUpdate: false,
        channelDeletion: false,
        roleCreation: false,
        roleUpdate: false,
        roleDeletion: false,
        serverUpdate: false,
        emojiAndStickerChanges: false,
        memberRoleChanges: false,
        nameChanges: false,
        avatarChanges: false,
        memberBans: false,
        memberUnbans: false,
        joinVoice: false,
        moveBetweenVoiceChannels: false,
        leaveVoice: false,
        messageDeletion: false,
        messageEdit: false,
        messagePurge: false,
        discordInvites: false,
        memberJoin: false,
        memberLeave: false,
        defaultLogChannel: null,
        memberLogChannel: null,
        serverLogChannel: null,
        voiceLogChannel: null,
        joinLeaveLogChannel: null,
        ignoredChannels: null,
      };
    }

    delete logging.guildID;
    delete logging.id;
    delete logging.createdAt;
    delete logging.updatedAt;

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(Colors.Blurple)
        .setTimestamp()
        .setTitle("Current Configuration:");

      const text = [];

      for (const [key, value] of Object.entries(logging)) {
        if (key.includes("Log") || key === "ignoredChannels") {
          text.push(`${key}: ${value ? value : "disabled"}`);
        } else {
          text.push(`${key}: ${value ? "enabled" : "disabled"}`);
        }
      }

      embed.setDescription(`\`\`\`\n${text.join("\n")}\n\`\`\``);
      embed.setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

      const embed2 = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(Colors.Blurple)
        .setTimestamp()
        .setTitle("Example")
        .setDescription(
          `**Proper Usage:**\n• \`${client.prefixes.get(message.guild.id)}${
            module.exports.name
          } <event> <enable|disable>\`\n• \`${client.prefixes.get(
            message.guild.id
          )}${
            module.exports.name
          } <channelLogOption> <channel>\`\n**Example:**\n• \`${client.prefixes.get(
            message.guild.id
          )}${
            module.exports.name
          } messageDeletion enable\`\n• \`${client.prefixes.get(
            message.guild.id
          )}${
            module.exports.name
          } defaultLogChannel #mod-logs\`\n• \`${client.prefixes.get(
            message.guild.id
          )}${module.exports.name} defaultLogChannel #mod-logs --remove\``
        );

      new Paginate(client, message, [embed, embed2]).init();

      return;
    }

    if (args[0].toLowerCase() === "all") {
      let set = false;

      if (args[1].toLowerCase() === "enable") {
        set = true;
      }

      const {
        // eslint-disable-next-line no-unused-vars
        defaultLogChannel,
        // eslint-disable-next-line no-unused-vars
        memberLogChannel,
        // eslint-disable-next-line no-unused-vars
        serverLogChannel,
        // eslint-disable-next-line no-unused-vars
        voiceLogChannel,
        // eslint-disable-next-line no-unused-vars
        joinLeaveLogChannel,
        // eslint-disable-next-line no-unused-vars
        ignoredChannels,
        ...events
      } = logging;

      Object.keys(events).forEach((event) => {
        logging[event] = set;
      });

      try {
        logging.guildID = message.guild.id;

        await schemas.logging().create(logging);
      } catch {
        delete logging.guildID;

        await schemas
          .logging()
          .update(logging, { where: { guildID: message.guild.id } });
      }

      client.loggings.set(message.guild.id, logging);

      return message.channel.send(
        `Successfully ${set ? "enabled" : "disabled"} all logging.`
      );
    } else if (
      Object.keys(logging).find(
        (a) => a.toLowerCase() === args[0].toLowerCase()
      )
    ) {
      const option = Object.keys(logging).find(
        (a) => a.toLowerCase() === args[0].toLowerCase()
      );
      let set = false;

      if (!args[1]) {
        return argsError(module.exports, client, message);
      }

      if (
        option === "defaultLogChannel" ||
        option === "memberLogChannel" ||
        option === "serverLogChannel" ||
        option === "voiceLogChannel" ||
        option === "joinLeaveLogChannel" ||
        option === "ignoredChannels"
      ) {
        const channel = await getChannelFromArguments(message, args[1]);

        if (!channel) {
          return message.channel.send("Invalid channel.");
        }

        set = channel.id;
      } else {
        if (args[1].toLowerCase() === "enable") {
          set = true;
        }
        args[2] == null;
      }

      if (option === "ignoredChannels") {
        if (logging[option]) {
          logging[option] = logging[option].split("|");
        }

        if (args[2] && args[2].toLowerCase() === "--remove") {
          if (!logging[option]) {
            return message.channel.send("No channels to remove.");
          }

          if (!logging[option].includes(set)) {
            return message.channel.send("Channel is not in the ignore list.");
          }

          logging[option] = deleteElement(logging[option], set);
          logging[option] = logging[option].join("|");
        } else {
          if (logging[option]) {
            logging[option].push(set);
            logging[option] = logging[option].join("|");
          } else {
            logging[option] = set;
          }
        }
      } else {
        if (args[2] && args[2].toLowerCase() === "--remove") {
          logging[option] = null;
        } else {
          logging[option] = set;
        }
      }

      logging.guildID = message.guild.id;

      try {
        await schemas.logging().create(logging);
      } catch {
        delete logging.guildID;

        await schemas
          .logging()
          .update(logging, { where: { guildID: message.guild.id } });
      }

      client.loggings.set(message.guild.id, logging);

      if (option === "ignoredChannels") {
        if (args[2] && args[2].toLowerCase() === "--remove") {
          return message.channel.send(
            `Successfully removed <#${set}> from ignore list.`
          );
        } else {
          return message.channel.send(
            `Successfully added <#${set}> to ignore list.`
          );
        }
      } else {
        return message.channel.send(
          `Successfully set \`${option}\` to ${
            typeof set === "boolean"
              ? `\`${logging[option]}\``
              : logging[option] === null
              ? "`none`"
              : `<#${logging[option]}>`
          }`
        );
      }
    }

    return argsError(module.exports, client, message);
  },
  interaction: {
    data: applyDefaultPermission(
      slashCommand("logging", "Toggles logging for certain events.", (builder) =>
        builder
          .addSubcommand((subcommand) =>
            subcommand
              .setName("view")
              .setDescription("View the current logging configuration"),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("all")
              .setDescription("Enable or disable all logging events")
              .addStringOption((option) =>
                option
                  .setName("mode")
                  .setDescription("Whether to enable or disable logging")
                  .setRequired(true)
                  .addChoices(...modeChoices),
              ),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("event")
              .setDescription("Enable or disable one logging event")
              .addStringOption((option) =>
                addChoiceList(
                  option
                    .setName("event")
                    .setDescription("Logging event to update")
                    .setRequired(true),
                  loggingEventOptions,
                ),
              )
              .addStringOption((option) =>
                option
                  .setName("mode")
                  .setDescription("Whether to enable or disable this event")
                  .setRequired(true)
                  .addChoices(...modeChoices),
              ),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("channel")
              .setDescription("Set or remove a logging channel")
              .addStringOption((option) =>
                addChoiceList(
                  option
                    .setName("option")
                    .setDescription("Logging channel option to update")
                    .setRequired(true),
                  loggingChannelOptions,
                ),
              )
              .addChannelOption((option) =>
                channelOption(option, "channel", "Channel to use for logging"),
              )
              .addBooleanOption((option) =>
                option
                  .setName("remove")
                  .setDescription("Remove this channel instead of setting it")
                  .setRequired(false),
              ),
          ),
      ),
      "ManageMessages",
    ),
    run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "view") {
        return runPrefixCommand(client, interaction, module.exports);
      }

      if (subcommand === "all") {
        return runPrefixCommand(client, interaction, module.exports, [
          "all",
          interaction.options.getString("mode", true),
        ]);
      }

      if (subcommand === "event") {
        return runPrefixCommand(client, interaction, module.exports, [
          interaction.options.getString("event", true),
          interaction.options.getString("mode", true),
        ]);
      }

      const args = [
        interaction.options.getString("option", true),
        interaction.options.getChannel("channel", true).id,
      ];

      if (interaction.options.getBoolean("remove")) {
        args.push("--remove");
      }

      return runPrefixCommand(client, interaction, module.exports, args);
    },
  },
};
