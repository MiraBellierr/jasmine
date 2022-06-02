const fs = require("fs");
const Signale = require('signale');
const signale = require('signale');
const Ascii = require("ascii-table");
const table = new Ascii("Events");

table.setHeading("Event", "File", "Status");

const options = {
	disabled: false,
	interactive: false,
	logLevel: 'info',
	scope: 'custom',
	secrets: [],
	stream: process.stdout,
	types: {
	  loading: {
			badge: '↻',
			color: 'yellow',
			label: 'loading',
			logLevel: 'info'
	  }
	}
};

const custom = new Signale(options);

module.exports = (client) => {
	const folders = fs.readdirSync("src/events/").forEach((dir) => {
		const events = fs.readdirSync(`src/events/${dir}/`);

		for (const file of events) {
			const module = require(`../events/${dir}/${file}`);

			client.on(dir.split(".")[0], (...args) => module(client, ...args));

			table.addRow(dir, file, "✅");
		}
	});
	console.log("=============================")
	signale.watch(`Loading events...`)
	custom.loading("\n" + table.toString());
};
