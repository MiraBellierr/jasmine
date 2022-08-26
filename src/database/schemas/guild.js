const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
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
