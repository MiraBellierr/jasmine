const axios = require("axios");
const Discord = require("discord.js");
const { argsError } = require("../../utils/errors");
const Paginate = require("../../utils/pagination");

module.exports = {
  name: "starrail",
  category: "anime",
  description: `Send star rail image info`,
  usage: "<uid>",
  run: async (client, message, args) => {
    if (!args[0] || isNaN(args[0])) {
      return argsError(module.exports, client, message);
    }

    const url = "https://starraillcard.up.railway.app/api/card";
    const url2 = "https://starraillcard.up.railway.app/api/profile";
    const headers = { "Content-Type": "application/json" };

    const data = {
      uid: args[0],
      lang: "en",
      image: {
        8004: "https://s1.zerochan.net/Stelle.600.3918384.jpg",
        1102: "https://s1.zerochan.net/Seele.%28Honkai.Star.Rail%29.600.3978285.jpg",
        1212: "https://s1.zerochan.net/Jingliu.600.4045195.jpg",
        1209: "https://s1.zerochan.net/Yanqing.600.3910167.jpg",
        1203: "https://s1.zerochan.net/Luocha.600.3980315.jpg",
        1208: "https://s1.zerochan.net/Fu.Xuan.600.3936904.jpg",
      },
    };

    try {
      const m = await message.channel.send("*Please wait...*");

      const response = await axios.post(url, data, { headers });
      const response2 = await axios.post(url2, data, { headers });

      if (response.status === 200 && response2.status === 200) {
        const responseData = response.data;
        const responseData2 = response2.data;

        if (!responseData.message && !responseData2.message) {
          const cards = [{ attachment: responseData2.card }];

          responseData.card.map((c) => {
            cards.push({ attachment: c.card });
          });

          new Paginate.Paginate(client, message, cards, true).init();
          m.delete();
        } else {
          console.log("Request failed");
          console.log(responseData.message);
        }
      } else {
        console.log(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("Error during the request:", error.message);
    }
  },
  //   interaction: {
  //     data: {
  //       name: "starrail",
  //       type: 1,
  //       description: `Send starrail character info`,
  //       options: [
  //         {
  //           name: "UID",
  //           type: 3,
  //           description: "Star Rail UID",
  //           required: true,
  //         },
  //       ],
  //     },
  //     run: async (client, interaction) => {},
  //   },
};
