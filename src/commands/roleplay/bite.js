const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "bite",
  description: "Bite a member",
  target: "required",
  targetLine: "bites",
  countLine: "Bitten",
});
