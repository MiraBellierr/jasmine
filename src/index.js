require("dotenv").config();
const { ShardingManager } = require("discord.js");
const log = require("node-pretty-log");
const manager = new ShardingManager("src/engine.js", {
	token: process.env.TOKEN,
});

manager.on("shardCreate", (shard) => log("info", `Launched shard ${shard.id}`));
manager.spawn();
