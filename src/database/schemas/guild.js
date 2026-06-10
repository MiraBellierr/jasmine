const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Guild = sequelize.define("guild", {
    guildID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    prefix: {
      type: Sequelize.STRING,
    },
  });

  Guild.sync();

  return Guild;
};
