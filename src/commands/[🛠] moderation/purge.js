const { argsError } = require("../../utils/errors");

module.exports = {
	name: "purge",
	category: "[🛠] moderation",
	description: "delete some messages",
	usage: "<count>",
	run: async (client, message, args) => {
		let messageCount = args[0];

		if (!messageCount || isNaN(messageCount))
			return message.channel.send(argsError(module.exports, client, message));

		if (messageCount > 100) {
			messageCount = 100;
		}

		const fetch = await message.channel.messages.fetch({ limit: messageCount });
		const deletedMessages = (await message.channel.bulkDelete(fetch, true)).map(
			(m) => m
		);

		deletedMessages.shift();

		const results = {};

		for (const deleted of deletedMessages) {
			const user = `${deleted.author.tag}`;

			if (!user) {
				continue;
			} else if (!results[user]) {
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
	},
};
