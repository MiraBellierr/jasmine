const Giveaway = require("../../utils/giveaway");

module.exports = async (client) => {
  new Giveaway(client).init();
};
