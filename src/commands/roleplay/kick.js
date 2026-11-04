const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "kick",
  description: "Kick a member",
  target: "required",
  targetLine: "kicks",
  countLine: "Kicked",
});
