const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "punch",
  description: "Punch a member",
  target: "required",
  targetLine: "punches",
  countLine: "Punched",
});
