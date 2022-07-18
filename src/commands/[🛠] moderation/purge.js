const { argsError } = require("../../utils/errors");
const { PermissionsBitField } = require("discord.js");

module.exports = {
	name: "purge",
	category: "[🛠] moderation",
	description: "delete some messages",
	clientPermissions: PermissionsBitField.Flags.ManageMessages,
	memberPermissions: PermissionsBitField.Flags.ManageMessages,
	usage: "[bot] <count>",
	run: async (client, message, args) => {
		if (message.deletable) message.delete();

		if (!isNaN(args[0])) {
			let messageCount = args[0];

			if (!messageCount || isNaN(messageCount))
				return argsError(module.exports, client, message);

			if (messageCount > 100) {
				messageCount = 100;
			}

			const fetch = await message.channel.messages.fetch({
				limit: parseInt(messageCount),
			});

			const deletedMessages = (
				await message.channel.bulkDelete(fetch, true)
			).map((m) => m);

			const results = {};

			for (const deleted of deletedMessages) {
				if (!deleted) continue;

				const user = `${deleted.author.tag}`;

				if (!results[user]) {
					results[user] = 0;
				}

				results[user]++;
			}

			const userMessageMap = Object.entries(results);
			const formed = `${deletedMessages.length} message${
				deletedMessages.length > 1 ? "s" : ""
			} were removed.\n\n${userMessageMap
				.map(([user, messages]) => `**${user}**: ${messages}`)
				.join("\n")}`;

			message.channel.send(formed).then((m) => {
				setTimeout(() => {
					m.delete();
				}, 5000);
			});
		} else if (args[0] === "bot") {
			let messageCount = args[1];

			if (!messageCount || isNaN(messageCount))
				return argsError(module.exports, client, message);

			if (messageCount > 100) {
				messageCount = 100;
			}

			let fetch = await message.channel.messages.fetch();

			fetch = fetch
				.filter((m) => m.author.bot)
				.toJSON()
				.slice(0, parseInt(messageCount));

			const deletedMessages = (
				await message.channel.bulkDelete(fetch, true)
			).map((m) => m);

			const results = {};

			for (const deleted of deletedMessages) {
				if (!deleted) continue;

				const user = `${deleted.author.tag}`;

				if (!results[user]) {
					results[user] = 0;
				}

				results[user]++;
			}

			const userMessageMap = Object.entries(results);
			const formed = `${deletedMessages.length} message${
				deletedMessages.length > 1 ? "s" : ""
			} were removed.\n\n${userMessageMap
				.map(([user, messages]) => `**${user}**: ${messages}`)
				.join("\n")}`;

			message.channel.send(formed).then((m) => {
				setTimeout(() => {
					m.delete();
				}, 5000);
			});
		} else {
			return argsError(module.exports, client, message);
		}
	},
};
