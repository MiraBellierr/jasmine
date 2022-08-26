const fs = require("fs");
const Ascii = require("ascii-table");
const table = new Ascii("Interactions");
const signale = require("signale");
const constants = require("../utils/constants");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");

table.setHeading("Interaction", "Status");

const custom = new signale.Signale(constants.options.handler);

module.exports = (client) => {
  const interactions = [];

  fs.readdirSync("src/commands/").forEach((dir) => {
    const files = fs.readdirSync(`src/commands/${dir}/`);

    for (const file of files) {
      const command = require(`../commands/${dir}/${file}`);

      if (command.interaction && command.interaction.data) {
        const interaction = command.interaction.data;
        console.log(interaction);
        client.interactions.set(interaction.name, command.interaction);
        interactions.push(interaction);
        table.addRow(file, "✅");
      } else {
        table.addRow(file, "❎ -> no interaction found");
      }
    }
  });

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  rest
    .put(Routes.applicationCommands(client.user.id), { body: interactions })
    .then(
      () => {
        console.log("=============================");
        signale.watch("Loading interactions...");
        custom.loading("\n" + table.toString());
      },
      (err) => console.log(err)
    );
};
