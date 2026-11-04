const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "slap",
  description: "Slap a member",
  target: "required",
  targetLine: "slaps",
  countLine: "Slapped",
});
