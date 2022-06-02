module.exports = {
	name: "eval",
	aliases: ["e"],
	description: "Evaluates the code you put in",
	usage: "<code to eval>",
	run: async (client, message, args) => {
		const clientApplication = await client.application.fetch();
		const owner = clientApplication.owner;

		if (!owner || owner.id !== message.author.id) {
			return message.reply("You're not the owner of me!!");
		}

		if (!args[0]) {
			return message.reply("You need to evaluate _**SOMETHING**_, please?");
		}

		const clean = (text) => {
			if (typeof text === "string") {
				return text
					.replace(/`/g, "`" + String.fromCharCode(8203))
					.replace(/@/g, "@" + String.fromCharCode(8203));
			} else {
				return text;
			}
		};

		try {
			const code = args.join(" ");
			let evaled = await eval(code);

			if (typeof evaled !== "string") {
				evaled = require("util").inspect(evaled);
			}

			message.reply(clean(evaled), { split: true, code: "xl" });
		} catch (err) {
			message.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``, {
				split: true,
				code: "xl",
			});
		}
	},
};
