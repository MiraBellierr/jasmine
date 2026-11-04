const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "poke",
  description: "Poke a member",
  target: "required",
  targetLine: "pokes",
  countLine: "Poked",
});
