const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Roleplay = sequelize.define("roleplay", {
    userID: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    targetId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    actionType: {
        type: Sequelize.STRING,
        allowNull: false,
    }
  });

  Roleplay.sync();

  return Roleplay;
};
