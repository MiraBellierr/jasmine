// @ts-nocheck

const { Client, Collection, Intents } = require("discord.js");
const fs = require("fs");
const { GiveawaysManager } = require("./utils/giveaway");
const client = new Client({
	allowedMentions: { parse: ["users"] },
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	],
});

client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("src/commands/");
client.prefixes = new Collection();
client.welcomes = new Collection();
client.leaves = new Collection();
client.starboards = new Collection();
client.giveawaysManager = new GiveawaysManager(client, {
	storage: "./src/database/json/giveaways.json",
	updateCountdownEvery: 5000,
	default: {
		botsCanWin: false,
		embedColor: "#CD1C6C",
		embedColorEnd: "#CD1C6C",
		reaction: "🎉",
	},
});

fs.readdirSync("src/handler/").forEach((handler) =>
	require(`./handler/${handler}`)(client)
);

client.login(process.env.TOKEN);
