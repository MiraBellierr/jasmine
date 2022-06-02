require("dotenv").config();
const { ShardingManager } = require("discord.js");
const log = require("node-pretty-log");
const manager = new ShardingManager("src/engine.js", {
        token: process.env.TOKEN,
});
const signale = require('signale');

console.log(" _                           ")
console.log("| |                          ")
console.log("| | ____ _ _ __  _ __   __ _ ")
console.log("| |/ / _` | '_ \| '_ \ / _` |")
console.log("|   < (_| | | | | | | | (_| |")
console.log("|_|\_\__,_|_| |_|_| |_|\__,_|")
console.log("                             ")
console.log("=============================")
signale.start('Launching shard manager, please wait...');
console.log("=============================")
manager.on("shardCreate", (shard) => signale.success(`Launched shard ${shard.id}`));
manager.spawn();
