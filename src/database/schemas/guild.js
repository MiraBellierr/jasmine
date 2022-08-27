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
