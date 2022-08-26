const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    logging: false,
    dialect: "sqlite",
    storage: "database.sqlite",
  }
);

module.exports = () => {
  const Logging = sequelize.define("logging", {
    guildID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    channelCreation: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    channelUpdate: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    channelDeletion: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    roleCreation: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    roleUpdate: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    roleDeletion: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    serverUpdate: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    emojiAndStickerChanges: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    memberRoleChanges: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    nameChanges: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    avatarChanges: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    memberBans: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    memberUnbans: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    joinVoice: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    moveBetweenVoiceChannels: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    leaveVoice: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    messageDeletion: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    messageEdit: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    messagePurge: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    discordInvites: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    memberJoin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    memberLeave: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    defaultLogChannel: {
      type: Sequelize.STRING,
    },
    memberLogChannel: {
      type: Sequelize.STRING,
    },
    serverLogChannel: {
      type: Sequelize.STRING,
    },
    voiceLogChannel: {
      type: Sequelize.STRING,
    },
    joinLeaveLogChannel: {
      type: Sequelize.STRING,
    },
    ignoredChannels: {
      type: Sequelize.STRING,
    },
  });

  Logging.sync();

  return Logging;
};
