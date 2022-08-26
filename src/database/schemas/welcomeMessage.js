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
  const WelcomeMessage = sequelize.define("welcomeMessage", {
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
    authorName: {
      type: Sequelize.STRING,
    },
    authorURL: {
      type: Sequelize.STRING,
    },
    title: {
      type: Sequelize.STRING,
    },
    titleURL: {
      type: Sequelize.STRING,
    },
    color: {
      type: Sequelize.STRING,
    },
    thumbnail: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    footerText: {
      type: Sequelize.STRING,
    },
    footerURL: {
      type: Sequelize.STRING,
    },
  });

  WelcomeMessage.sync();

  return WelcomeMessage;
};
