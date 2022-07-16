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
	const Timers = sequelize.define("timer", {
		userID: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		work: {
			type: Sequelize.DATE,
		},
	});

	Timers.sync();

	return Timers;
};
