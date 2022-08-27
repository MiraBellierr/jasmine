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
  const Starboard = sequelize.define("starboard", {
    guildID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    channelID: {
      type: Sequelize.STRING,
    },
    switch: {
      type: Sequelize.BOOLEAN,
    },
    star: {
      type: Sequelize.BIGINT,
    },
  });

  Starboard.sync();

  return Starboard;
};
