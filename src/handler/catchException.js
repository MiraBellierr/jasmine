const contants = require("../utils/constants");

module.exports = (client) => {
	process.on("unhandledRejection", async (reason) => {
		console.log(reason);

		const channel = await client.channels.fetch(contants.errorChannel.id);

		channel.send(`An error occured: \n\`\`\`js\n${reason.stack}\n\`\`\``);

		setTimeout(() => {
			process.exit(1);
		}, 100);
	});
	process.on("uncaughtException", async (err) => {
		console.log(err);

		const channel = await client.channels.fetch(contants.errorChannel.id);

		channel.send(`An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``);

		setTimeout(() => {
			process.exit(1);
		}, 100);
	});
	process.on("uncaughtExceptionMonitor", async (err) => {
		console.log(err);

		const channel = await client.channels.fetch(contants.errorChannel.id);

		channel.send(`An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``);

		setTimeout(() => {
			process.exit(1);
		}, 100);
	});
};
