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
  const Character = sequelize.define("character", {
    userID: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    class: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    level: {
      type: Sequelize.BIGINT,
      defaultValue: 1,
    },
    xp: {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    },
    xpNeeded: {
      type: Sequelize.BIGINT,
      defaultValue: 10,
    },
    hp: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    str: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    agl: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    sta: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    acc: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    eva: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    att: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    def: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    img: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    equipments: {
      type: Sequelize.TEXT,
    },
  });

  Character.sync();

  return Character;
};
