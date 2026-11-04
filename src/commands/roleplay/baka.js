const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "baka",
  description: "Call a member a baka",
  target: "required",
  targetLine: (name) => `calls ${name} a baka`,
  countLine: "Called a baka",
});
