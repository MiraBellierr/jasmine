const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "purge",
  category: "moderation",
  description: "delete some messages",
  clientPermission: "ManageMessages",
  memberPermission: "ManageMessages",
  usage: "<count> [bots]",
  run: async (client, message, args) => {
    if (isNaN(args[0]) || parseInt(args[0]) <= 0) {
      return message.channel.send(
        "Yeah.... That's not a number? I also can't delete 0 messages btw."
      );
    }

    let deleteAmount;

    if (parseInt(args[0]) > 100) {
      deleteAmount = 100;
    } else {
      deleteAmount = parseInt(args[0]);
    }

    let fetch = await message.channel.messages.fetch();

    if (args[1] && args[1] === "bots") {
      fetch = fetch
        .filter((m) => m.author.bot)
        .toJSON()
        .map((m) => m.id)
        .slice(0, deleteAmount);

      message.channel
        .bulkDelete(fetch)
        .then(async (deleted) => {
          const m = await message.channel.send(
            `I deleted \`${deleted.size}\` messages.`
          );
          setTimeout(function () {
            m.delete();
          }, 1000);
        })
        .catch((e) =>
          console.log(
            `[WARN] ${e.message} in ${e.filename} [${e.lineNumber}, ${e.columnNumber}]`
          )
        );

      return;
    }

    fetch = fetch
      .toJSON()
      .map((m) => m.id)
      .slice(0, deleteAmount + 1);

    message.channel
      .bulkDelete(fetch, true)
      .then(async (deleted) => {
        const m = await message.channel.send(
          `I deleted \`${deleted.size - 1}\` messages.`
        );
        setTimeout(function () {
          m.delete();
        }, 1000);
      })
      .catch((e) =>
        console.log(
          `[WARN] ${e.message} in ${e.filename} [${e.lineNumber}, ${e.columnNumber}]`
        )
      );
  },
  interaction: {
    data: {
      name: "purge",
      description: "delete some messages",
      type: 1,
      default_member_permissions:
        PermissionsBitField.Flags.ManageMessages.toString(),
      options: [
        {
          name: "count",
          description: "how many messages to delete",
          type: 4,
          min_value: 1,
          max_value: 100,
          required: true,
        },
        {
          name: "bots",
          description: "delete only bots messages",
          type: 3,
          choices: [
            {
              name: "yes",
              value: "yes",
            },
          ],
        },
      ],
    },
    run: async (client, interaction) => {
      const count = interaction.options.getInteger("count");
      const bots = interaction.options.getString("bots") === "yes";

      let fetch = await interaction.channel.messages.fetch();

      if (bots) {
        fetch = fetch
          .filter((m) => m.author.bot)
          .toJSON()
          .map((m) => m.id)
          .slice(0, count);

        interaction.channel
          .bulkDelete(fetch)
          .then(async (deleted) => {
            interaction.reply(`I deleted \`${deleted.size}\` messages.`);
            setTimeout(function () {
              interaction.deleteReply();
            }, 1000);
          })
          .catch((e) =>
            console.log(
              `[WARN] ${e.message} in ${e.filename} [${e.lineNumber}, ${e.columnNumber}]`
            )
          );

        return;
      }

      fetch = fetch
        .toJSON()
        .map((m) => m.id)
        .slice(0, count);

      interaction.channel
        .bulkDelete(fetch)
        .then(async (deleted) => {
          interaction.reply(`I deleted \`${deleted.size}\` messages.`);
          setTimeout(function () {
            interaction.deleteReply();
          }, 1000);
        })
        .catch((e) =>
          console.log(
            `[WARN] ${e.message} in ${e.filename} [${e.lineNumber}, ${e.columnNumber}]`
          )
        );
    },
  },
};
