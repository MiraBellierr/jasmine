const { argsError } = require("../../utils/errors");
const poll = require("../../utils/poll");

module.exports = {
	name: "poll",
	category: "[✨] utility",
	description: "Creates a poll",
	usage: "<title> | <option1> | <option2> | [option3]",
	run: async (client, message, args) => {
		if (!args.length || !args[2])
			return argsError(module.exports, client, message);

		const title = args
			.join(" ")
			.split("|")
			.map((a) => a.trim());
		const options = title.splice(1);

		if (!options) return argsError(module.exports, client, message);

		if (message.deletable) {
			message.delete();
		}

		poll(message, title, options);
	},
};
