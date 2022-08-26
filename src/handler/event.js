const fs = require("fs");
const signale = require("signale");
const Ascii = require("ascii-table");
const table = new Ascii("Events");
const constants = require("../utils/constants");

table.setHeading("Event", "File", "Status");

const custom = new signale.Signale(constants.options.handler);

module.exports = (client) => {
  fs.readdirSync("src/events/").forEach((dir) => {
    const events = fs.readdirSync(`src/events/${dir}/`);

    for (const file of events) {
      const module = require(`../events/${dir}/${file}`);

      client.on(dir.split(".")[0], (...args) => module(client, ...args));

      table.addRow(dir, file, "✅");
    }
  });
  console.log("=============================");
  signale.watch("Loading events...");
  custom.loading("\n" + table.toString());
};
