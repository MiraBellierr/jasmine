const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Starboard = sequelize.define("starboard", {
    guildID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    channelID: {
      type: Sequelize.STRING,
    },
    switch: {
      type: Sequelize.BOOLEAN,
    },
    star: {
      type: Sequelize.BIGINT,
    },
  });

  Starboard.sync();

  return Starboard;
};
