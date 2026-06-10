const Sequelize = require("sequelize");
const createSequelize = require("../createSequelize");

const sequelize = createSequelize();

module.exports = () => {
  const Giveaway = sequelize.define("giveaway", {
    messageID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    options: {
      type: Sequelize.STRING,
    },
  });

  Giveaway.sync();

  return Giveaway;
};
