const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "cuddle",
  description: "Cuddle a member",
  target: "required",
  targetLine: "cuddles",
  countLine: "Cuddled",
});
