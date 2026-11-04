const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "stare",
  description: "Stare at a member",
  target: "required",
  targetLine: "stares at",
  countLine: "Stared at",
});
