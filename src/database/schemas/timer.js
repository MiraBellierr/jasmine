const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Timers = sequelize.define("timer", {
    userID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    work: {
      type: Sequelize.DATE,
    },
    beg: {
      type: Sequelize.DATE,
    },
    crime: {
      type: Sequelize.DATE,
    },
    daily: {
      type: Sequelize.DATE,
    },
  });

  Timers.sync();

  return Timers;
};
