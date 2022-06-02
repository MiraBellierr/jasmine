const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
	host: "localhost",
	logging: false,
	dialect: "sqlite",
	storage: "database.sqlite",
});

module.exports = () => {
	const LeaveMessage = sequelize.define("leaveMessage", {
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

	LeaveMessage.sync();

	return LeaveMessage;
};
