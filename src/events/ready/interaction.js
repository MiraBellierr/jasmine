const interaction = require("../../handler/interaction");

module.exports = async (client) => {
  if (client.shard && !client.shard.ids.includes(0)) {
    return;
  }

  await interaction(client);

  console.log("Interactions registered.");
};
