const Sequelize = require("sequelize");
const betterSqlite3Dialect = require("./betterSqlite3Dialect");

module.exports = () =>
  new Sequelize(
    // eslint-disable-next-line no-undef
    process.env.DB_NAME,
    // eslint-disable-next-line no-undef
    process.env.DB_USER,
    // eslint-disable-next-line no-undef
    process.env.DB_PASSWORD,
    {
      dialect: "sqlite",
      dialectModule: betterSqlite3Dialect,
      host: "localhost",
      logging: false,
      storage: "database.sqlite",
    },
  );
