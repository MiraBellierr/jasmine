const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "kiss",
  description: "Kiss a member",
  target: "required",
  targetLine: "kisses",
  countLine: "Kissed",
});
