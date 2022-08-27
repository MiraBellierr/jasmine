const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  // eslint-disable-next-line no-undef
  process.env.DB_NAME,
  // eslint-disable-next-line no-undef
  process.env.DB_USER,
  // eslint-disable-next-line no-undef
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    logging: false,
    dialect: "sqlite",
    storage: "database.sqlite",
  }
);

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
