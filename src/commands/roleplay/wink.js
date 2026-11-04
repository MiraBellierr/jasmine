const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "wink",
  description: "Wink at a member",
  target: "optional",
  soloLine: "winks",
  targetLine: "winks at",
  countLine: "Winked at",
});
