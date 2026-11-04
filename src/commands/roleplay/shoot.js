const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "shoot",
  description: "Shoot a member",
  target: "required",
  targetLine: "shoots",
  countLine: "Shot",
});
