const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "yeet",
  description: "Yeet a member",
  target: "required",
  targetLine: "yeets",
  countLine: "Yeeted",
});
