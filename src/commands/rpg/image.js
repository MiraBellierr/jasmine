const schemas = require("../../database/schemas");
const characters = require("../../database/json/characters.json");
const economies = require("../../utils/economies");
const constants = require("../../utils/constants");
const Discord = require("discord.js");
const { Paginate } = require("../../utils/pagination");

module.exports = {
  name: "image",
  description: "display your hunted images",
  category: "rpg",
  run: async (client, message, args) => {
    const userCharacter = await schemas
      .character()
      .findOne({ where: { userID: message.author.id } });

    if (!userCharacter) {
      return message.channel.send(
        `You haven't registered yet! Use \`${client.prefixes.get(message.guild.id)}register\` to register.`,
      );
    }

    if (!args.length) {
      const images = JSON.parse(userCharacter.get("images"));

      const list = images.map(
        (ch) => `• [${characters[ch].name}](${characters[ch].image})`,
      );

      function chunkBreakforEmbed(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(
            new Discord.EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
              })
              .setDescription(array.slice(i, i + size).join("\n")),
          );
        }

        return result;
      }

      const imagesByChunk = chunkBreakforEmbed(list, 10);

      new Paginate(client, message, imagesByChunk).init();
    } else {
      const name = args.join(" ");
      const images = JSON.parse(userCharacter.get("images"));

      function searchCharacterByName(searchname) {
        return Object.entries(characters)
          .filter(([_, { name }]) =>
            name.toLowerCase().includes(searchname.toLowerCase()),
          )
          .map(([id]) => id);
      }

      const results = searchCharacterByName(name);

      if (results.length < 1) {
        return message.channel.send(
          "I didn't find that character in my database.",
        );
      }

      function findFirstCommonElement(array1, array2) {
        return array1.find((id) => array2.includes(id));
      }

      const result = findFirstCommonElement(results, images);

      if (!result) {
        message.channel.send("I didn't find that character in your inventory.");
      } else {
        const img = result;

        schemas.character().update(
          {
            img,
            name: characters[img].name,
          },
          { where: { userID: message.author.id } },
        );

        const embed = new Discord.EmbedBuilder()
          .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(
            `You have changed your character to ${characters[img].name}!`,
          )
          .setImage(characters[img].image);

        message.channel.send({ embeds: [embed] });
      }
    }
  },
};
