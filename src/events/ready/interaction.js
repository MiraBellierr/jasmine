const interaction = require("../../handler/interaction");

module.exports = (client) => {
	interaction(client);

	console.log("All ready!");
};
