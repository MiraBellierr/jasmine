const contants = require("../utils/constants");

module.exports = (client) => {
  // eslint-disable-next-line no-undef
  process.on("unhandledRejection", async (reason) => {
    console.log(reason);

    client.channels.fetch(contants.errorChannel.id).then(
      (channel) => {
        channel.send(`An error occured: \n\`\`\`js\n${reason.stack}\n\`\`\``);
      },
      () => null
    );

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      process.exit(1);
    }, 100);
  });
  // eslint-disable-next-line no-undef
  process.on("uncaughtException", async (err) => {
    console.log(err);

    client.channels.fetch(contants.errorChannel.id).then(
      (channel) => {
        channel.send(`An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``);
      },
      () => null
    );

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      process.exit(1);
    }, 100);
  });
  // eslint-disable-next-line no-undef
  process.on("uncaughtExceptionMonitor", async (err) => {
    console.log(err);

    client.channels.fetch(contants.errorChannel.id).then(
      (channel) => {
        channel.send(`An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``);
      },
      () => null
    );

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      process.exit(1);
    }, 100);
  });
};
