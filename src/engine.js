// @ts-nocheck

const { Client, Collection, Intents, Guild } = require("discord.js");
const fs = require("fs");
const { GiveawaysManager } = require("./utils/giveaway");
const Ascii = require("ascii-table");
const table = new Ascii("Database");
const schemas = require("./database/schemas");
const log = require("node-pretty-log");
const client = new Client({
	allowedMentions: { parse: ["users"] },
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});

table.setHeading("Schema", "Status");

client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("src/commands/");
client.prefixes = new Collection();
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

Object.keys(schemas).forEach((schema) => {
	schemas[schema]();

	table.addRow(schema, "✅");
});

(async () => {
	const Guilds = await schemas.guild().findAll();

	if (!Guild.length) return;

	Guilds.forEach((guild) =>
		client.prefixes.set(guild.dataValues.guildID, guild.dataValues.prefix)
	);
})();

log("info", "\n" + table.toString());

client.login(process.env.TOKEN);
