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
