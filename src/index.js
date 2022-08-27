require("dotenv").config();

const { ShardingManager } = require("discord.js");
const manager = new ShardingManager("src/engine.js", {
	// eslint-disable-next-line no-undef
	token: process.env.TOKEN,
});
const signale = require("signale");

console.log("       __                     _          ");
console.log("      / /___ __________ ___  (_)___  ___ ");
console.log(" __  / / __ `/ ___/ __ `__ `/ / __ `/ _ |");
console.log("/ /_/ / /_/ (__  ) / / / / / / / / /  __/");
// eslint-disable-next-line no-useless-escape
console.log("\____/\__,_/____/_/ /_/ /_/_/_/ /_/|___| ");
console.log("                                         ");
console.log("                             ");
console.log("=============================");
signale.start("Launching shard manager, please wait...");
console.log("=============================");
manager.on("shardCreate", (shard) =>
	signale.success(`Launched shard ${shard.id}`)
);
manager.spawn();
