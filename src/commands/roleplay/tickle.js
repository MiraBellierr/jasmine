const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "tickle",
  description: "Tickle a member",
  target: "required",
  targetLine: "tickles",
  countLine: "Tickled",
});
