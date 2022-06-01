const fs = require("fs");
const log = require("node-pretty-log");
const Ascii = require("ascii-table");
const table = new Ascii("Commands");

table.setHeading("Command", "Status");

module.exports = (client) => {
	fs.readdirSync("src/commands/").forEach((dir) => {
		const files = fs.readdirSync(`src/commands/${dir}/`);

		for (const file of files) {
			const command = require(`../commands/${dir}/${file}`);

			if (command.name) {
				client.commands.set(command.name, command);
				table.addRow(file, "✅");
			} else {
				table.addRow(file, "❎ -> no command.name found");
				continue;
			}

			if (command.aliases && Array.isArray(command.aliases))
				command.aliases.forEach((alias) =>
					client.aliases.set(alias, command.name)
				);
		}
	});

	log("info", "\n" + table.toString());
};
