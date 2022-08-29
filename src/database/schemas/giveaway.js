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
