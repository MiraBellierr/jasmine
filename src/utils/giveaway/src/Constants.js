exports.GiveawayMessages = {};
exports.GiveawayStartOptions = {};
exports.defaultGiveawayMessages = {
  giveaway: "@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉",
  giveawayEnded: "@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉",
  inviteToParticipate: "React with 🎉 to participate!",
  timeRemaining: "Time remaining: **{duration}**",
  winMessage: "Congratulations, {winners}! You won **{prize}**!\n{messageURL}",
  embedFooter: "Powered by the discord-giveaways package",
  noWinner: "Giveaway cancelled, no valid participations.",
  winners: "winner(s)",
  endedAt: "Ended at",
  hostedBy: "Hosted by: {user}",
  units: {
    seconds: "seconds",
    minutes: "minutes",
    hours: "hours",
    days: "days",
    pluralS: false,
  },
};
exports.BonusEntry = {};
exports.LastChanceOptions = {
  enabled: false,
  content: "⚠️ **LAST CHANCE TO ENTER !** ⚠️",
  threshold: 5000,
  embedColor: "#FF0000",
};
exports.GiveawaysManagerOptions = {};
exports.defaultManagerOptions = {
  storage: "./giveaways.json",
  updateCountdownEvery: 5000,
  endedGiveawaysLifetime: null,
  hasGuildMemberIntent: false,
  default: {
    botsCanWin: false,
    exemptPermissions: [],
    exemptMembers: () => false,
    embedColor: "#FF0000",
    embedColorEnd: "#000000",
    reaction: "🎉",
    lastChance: {
      enabled: false,
      content: "⚠️ **LAST CHANCE TO ENTER !** ⚠️",
      secondsBeforeLastChance: 5000,
      embedColor: "#FF0000",
    },
  },
};
exports.GiveawayRerollOptions = {};
exports.defaultRerollOptions = {
  winnerCount: null,
  messages: {
    congrat:
      ":tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}",
    error: "No valid participations, no new winner(s) can be chosen!",
  },
};
exports.GiveawayEditOptions = {};
exports.GiveawayData = {};
