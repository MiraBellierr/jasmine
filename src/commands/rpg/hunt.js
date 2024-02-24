const schemas = require("../../database/schemas");
const characters = require("../../database/json/characters.json");
const economies = require("../../utils/economies");
const constants = require("../../utils/constants");
const Discord = require("discord.js");

module.exports = {
  name: "hunt",
  description: "Hunt for character",
  category: "rpg",
  run: async (client, message) => {
    const userCharacter = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!userCharacter) {
      return message.channel.send(
        `You haven't registered yet! Use \`${client.prefixes.get(message.guild.id)}register\` to register.`,
      );
    }

    const characterKeys = Object.keys(characters);

    const randomIndex = Math.floor(Math.random() * characterKeys.length);

    const randomCharacterKey = characterKeys[randomIndex];
    const randomCharacter = characters[randomCharacterKey];

    const images = JSON.parse(userCharacter.get("images"));

    if (images.includes(randomCharacterKey)) {
      const coins = await economies.getCoins(message.author);

      schemas.coins().update(
        {
          wallet: coins.get("wallet") + 20,
        },
        { where: { userID: message.author.id } },
      );

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `You found ${randomCharacter.name}! You already have it so it is converted to ${constants.coins.emoji} 20.`,
        )
        .setImage(randomCharacter.image);

      message.channel.send({ embeds: [embed] });
    } else {
      images.push(randomCharacterKey);

      schemas.character().update(
        {
          images: JSON.stringify(images),
        },
        {
          where: {
            userID: message.author.id,
          },
        },
      );

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(`You found ${randomCharacter.name}!`)
        .setImage(randomCharacter.image);

      message.channel.send({ embeds: [embed] });
    }
  },
};
