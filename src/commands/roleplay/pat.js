const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "pat",
  description: "Pat a member",
  target: "required",
  targetLine: "pats",
  countLine: "Patted",
});
