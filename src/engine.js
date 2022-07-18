const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const { GiveawaysManager } = require("./utils/giveaway");
const client = new Client({
	allowedMentions: { parse: ["users"] },
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("src/commands/");
client.prefixes = new Collection();
client.welcomes = new Collection();
client.leaves = new Collection();
client.starboards = new Collection();
client.timer = new Collection();
client.characters = new Collection();
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

Object.values(require("./database/json/characters.json")).forEach(
	(character) => {
		client.characters.set(character.name, character);
	}
);

fs.readdirSync("src/handler/").forEach((handler) =>
	require(`./handler/${handler}`)(client)
);

client.login(process.env.TOKEN);
