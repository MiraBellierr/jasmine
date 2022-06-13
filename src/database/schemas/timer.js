const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
	host: "localhost",
	logging: false,
	dialect: "sqlite",
	storage: "database.sqlite",
});

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
