const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "wave",
  description: "Wave at a member",
  target: "optional",
  soloLine: "waves",
  targetLine: "waves at",
  countLine: "Waved at",
});
