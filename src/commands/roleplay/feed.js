const { createRoleplayCommand } = require("../../utils/roleplay");

module.exports = createRoleplayCommand({
  name: "feed",
  description: "Feed a member",
  target: "required",
  targetLine: "feeds",
  countLine: "Fed",
});
