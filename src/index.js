require("dotenv").config();

const path = require("path");
const { ShardingManager } = require("discord.js");
const signale = require("signale");

const TOKEN = process.env.TOKEN;
const SHARD_COUNT = process.env.SHARD_COUNT?.trim();

if (!TOKEN) {
  signale.error("TOKEN is missing. Add it to .env before starting the bot.");
  process.exit(1);
}

let totalShards = "auto";

if (SHARD_COUNT) {
  const count = Number(SHARD_COUNT);

  if (!Number.isInteger(count) || count < 1) {
    signale.error("SHARD_COUNT must be a whole number of at least 1.");
    process.exit(1);
  }

  totalShards = count;
}

console.log("       __                     _          ");
console.log("      / /___ __________ ___  (_)___  ___ ");
console.log(" __  / / __ `/ ___/ __ `__ `/ / __ `/ _ |");
console.log("/ /_/ / /_/ (__  ) / / / / / / / / /  __/");
console.log("\\____/\\__,_/____/_/ /_/ /_/_/_/ /_/|___| ");
console.log("                                         ");
console.log("                             ");

const manager = new ShardingManager(path.join(__dirname, "engine.js"), {
  token: TOKEN,
  totalShards,
  respawn: true,
});

let stopping = false;

function stop(signal) {
  if (stopping) {
    return;
  }

  stopping = true;
  signale.warn(
    `${signal} received. Stopping ${manager.shards.size} shard${
      manager.shards.size === 1 ? "" : "s"
    }.`,
  );

  for (const shard of manager.shards.values()) {
    shard.kill();
  }

  process.exit(0);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));

manager.on("shardCreate", (shard) => {
  signale.info(`Launching shard ${shard.id}.`);

  shard.on("ready", () => {
    signale.success(`Shard ${shard.id} is ready.`);
  });

  shard.on("disconnect", () => {
    signale.warn(`Shard ${shard.id} disconnected.`);
  });

  shard.on("reconnecting", () => {
    signale.warn(`Shard ${shard.id} is reconnecting.`);
  });

  shard.on("resume", () => {
    signale.success(`Shard ${shard.id} resumed.`);
  });

  shard.on("error", (error) => {
    signale.error(`Shard ${shard.id}: ${error.message}`);
  });

  shard.on("death", () => {
    signale.error(`Shard ${shard.id} exited.`);
  });
});

async function start() {
  console.log("=============================");
  signale.start("Launching the shard manager...");
  console.log("=============================");

  try {
    const shards = await manager.spawn({ timeout: 60_000 });

    signale.success(
      `Started ${shards.size} shard${shards.size === 1 ? "" : "s"}.`,
    );
  } catch (error) {
    signale.error(`Could not start the shards: ${error.message}`);

    for (const shard of manager.shards.values()) {
      shard.kill();
    }

    process.exit(1);
  }
}

start();
