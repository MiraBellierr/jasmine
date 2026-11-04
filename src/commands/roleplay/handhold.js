const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "handhold",
  label: "Hand holding",
  description: "Hold hands with a member",
  target: "required",
  targetLine: "holds hands with",
  countLine: "Held hands",
});
