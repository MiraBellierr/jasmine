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
	const Coins = sequelize.define("coin", {
		userID: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		pocket: {
			type: Sequelize.BIGINT,
			defaultValue: 0,
		},
		bank: {
			type: Sequelize.BIGINT,
			defaultValue: 0,
		},
		maxDeposit: {
			type: Sequelize.BIGINT,
			defaultValue: 0,
		},
	});

	Coins.sync();

	return Coins;
};
