const argsError = (module, client, message) => {
  return message.channel.send(
    `The right syntax is \`${client.prefixes.get(message.guild.id)}${
      module.name
    } ${module.usage}\`.`
  );
};

module.exports = { argsError };
