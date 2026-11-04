const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "hug",
  description: "Hug a member",
  target: "required",
  targetLine: "hugs",
  countLine: "Hugged",
});
