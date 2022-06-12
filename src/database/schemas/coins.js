const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
	host: "localhost",
	logging: false,
	dialect: "sqlite",
	storage: "database.sqlite",
});

module.exports = () => {
	const Coins = sequelize.define("coin", {
		userID: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		pocket: {
			type: Sequelize.BIGINT,
		},
		bank: {
			type: Sequelize.BIGINT,
		},
	});

	Coins.sync();

	return Coins;
};
