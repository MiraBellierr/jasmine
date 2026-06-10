const fs = require("fs");
const Ascii = require("ascii-table");
const table = new Ascii("Interactions");
const signale = require("signale");
const constants = require("../utils/constants");
const { REST, Routes } = require("discord.js");

table.setHeading("Interaction", "Status");

const custom = new signale.Signale(constants.options.handler);

module.exports = async (client) => {
  const interactions = [];

  fs.readdirSync("src/commands/").forEach((dir) => {
    const files = fs.readdirSync(`src/commands/${dir}/`);

    for (const file of files) {
      const command = require(`../commands/${dir}/${file}`);

      if (command.interaction && command.interaction.data) {
        const interaction =
          typeof command.interaction.data.toJSON === "function"
            ? command.interaction.data.toJSON()
            : command.interaction.data;

        client.interactions.set(interaction.name, {
          ...command.interaction,
          command,
        });
        interactions.push(interaction);
        table.addRow(file, "✅");
      }
    }
  });

  // eslint-disable-next-line no-undef
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(Routes.applicationCommands(client.user.id), {
    body: interactions,
  });

  console.log("=============================");
  signale.watch(`Loading ${interactions.length} interactions...`);
  custom.loading("\n" + table.toString());
};
