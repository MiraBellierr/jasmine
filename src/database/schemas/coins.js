const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Coins = sequelize.define("coin", {
    userID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    wallet: {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    },
  });

  Coins.sync();

  return Coins;
};
