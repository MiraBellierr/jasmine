const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const { GiveawaysManager } = require("./utils/giveaway");
const utils = require("./utils/utils");
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
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.interactions = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("src/commands/");
client.prefixes = new Collection();
client.welcomes = new Collection();
client.leaves = new Collection();
client.starboards = new Collection();
client.loggings = new Collection();
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

async function start() {
  await utils.asyncForEach(fs.readdirSync("src/handler/"), async (handler) => {
    if (handler !== "interaction.js") {
      await require(`./handler/${handler}`)(client);
    }
  });

  // eslint-disable-next-line no-undef
  client.login(process.env.TOKEN);
}

start();
