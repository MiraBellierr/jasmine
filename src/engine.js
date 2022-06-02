// @ts-nocheck

const { Client, Collection, Intents, Guild } = require("discord.js");
const fs = require("fs");
const { GiveawaysManager } = require("./utils/giveaway");
const Ascii = require("ascii-table");
const table = new Ascii("Database");
const schemas = require("./database/schemas");
const { Signale } = require("signale");
const signale = require("signale");
const client = new Client({
	allowedMentions: { parse: ["users"] },
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});

const options = {
	disabled: false,
	interactive: false,
	logLevel: "info",
	scope: "custom",
	secrets: [],
	stream: process.stdout,
	types: {
		loading: {
			badge: "↻",
			color: "yellow",
			label: "loading",
			logLevel: "info",
		},
	},
};

const custom = new Signale(options);

table.setHeading("Schema", "Status");

client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("src/commands/");
client.prefixes = new Collection();
client.welcomes = new Collection();
client.leaves = new Collection();
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
	const WelcomeMessages = await schemas.welcomeMessage().findAll();
	const LeaveMessages = await schemas.leaveMessage().findAll();

	if (Guild.length) {
		Guilds.forEach((guild) =>
			client.prefixes.set(guild.dataValues.guildID, guild.dataValues.prefix)
		);
	}

	if (WelcomeMessages.length) {
		WelcomeMessages.forEach((welcomeMessage) =>
			client.welcomes.set(welcomeMessage.dataValues.guildID, {
				channelID: welcomeMessage.dataValues.channelID,
				switch: welcomeMessage.dataValues.switch,
				authorName: welcomeMessage.dataValues.authorName,
				authorURL: welcomeMessage.dataValues.authorURL,
				title: welcomeMessage.dataValues.title,
				titleURL: welcomeMessage.dataValues.titleURL,
				thumbnail: welcomeMessage.dataValues.thumbnail,
				description: welcomeMessage.dataValues.description,
				image: welcomeMessage.dataValues.image,
				footerText: welcomeMessage.dataValues.footerText,
				footerURL: welcomeMessage.dataValues.footerURL,
				color: welcomeMessage.dataValues.color,
			})
		);
	}

	if (LeaveMessages.length) {
		LeaveMessages.forEach((leaveMessage) =>
			client.leaves.set(leaveMessage.dataValues.guildID, {
				channelID: leaveMessage.dataValues.channelID,
				switch: leaveMessage.dataValues.switch,
				authorName: leaveMessage.dataValues.authorName,
				authorURL: leaveMessage.dataValues.authorURL,
				title: leaveMessage.dataValues.title,
				titleURL: leaveMessage.dataValues.titleURL,
				thumbnail: leaveMessage.dataValues.thumbnail,
				description: leaveMessage.dataValues.description,
				image: leaveMessage.dataValues.image,
				footerText: leaveMessage.dataValues.footerText,
				footerURL: leaveMessage.dataValues.footerURL,
				color: leaveMessage.dataValues.color,
			})
		);
	}
})();
console.log("=============================");
signale.watch(`Loading DB`);
custom.loading("\n" + table.toString());

client.login(process.env.TOKEN);
