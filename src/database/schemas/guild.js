const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
	host: "localhost",
	logging: false,
	dialect: "sqlite",
	storage: "database.sqlite",
});

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
