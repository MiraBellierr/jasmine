const interaction = require("../../handler/interaction");

module.exports = async (client) => {
  await interaction(client);

  console.log("All ready!");
};
