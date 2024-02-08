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
