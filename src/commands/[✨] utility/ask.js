const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const error = require("../../utils/errors");
const { setTimeout } = require("timers/promises");

module.exports = {
  name: "ask",
  description: "Ask a question to the bot",
  usage: "<question>",
  run: async (client, message, args) => {
    if (!args.length) return error.argsError(module.exports, client, message);

    const query = args.join(" ");

    message.channel.send("let me think... <:LumineThink:1014510903665889331>");

    const browser = await puppeteer.launch({
      headless: false,
    });
    try {
      const page = await browser.newPage();
      await page.goto(
        `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}`
      );

      await page.waitForSelector(
        "[id*=__] > div > div > div.wWOJcd > div.r21Kzd"
      );

      await page.click("#W0wltc").catch(() => null);
      await page.click("[id*=__] > div > div > div.wWOJcd > div.r21Kzd");

      await page.waitForSelector("[id*=__] > div > div > span.ILfuVd > span");

      const html = await page.content();
      const $ = cheerio.load(html);

      const question = $("[id^=exacc_] > span").first().text();
      let answer = $("[id*=__] > div > div > span.ILfuVd > span")
        .first()
        .text();

      message.channel.send(`So you want to know ${question.toLowerCase()}`);
      await setTimeout(3000);
      message.channel.send(`${answer} <:foxnote:1014517679576592505>`);

      await browser.close();
    } catch (e) {
      message.channel.send("I don't know <:LumineThink:1014510903665889331>");
      console.log(e);
      return browser.close();
    }
  },
  interaction: {
    data: {
      name: "ask",
      description: "Ask a question to the bot",
      type: 1,
      options: [
        {
          name: "question",
          description: "The question to ask",
          type: 3,
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      const query = interaction.options.getString("question");

      interaction.reply("let me think... <:LumineThink:1014510903665889331>");
      const browser = await puppeteer.launch({
        headless: false,
      });
      try {
        const page = await browser.newPage();
        await page.goto(
          `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}`
        );

        await page.waitForSelector(
          "[id*=__] > div > div > div.wWOJcd > div.r21Kzd"
        );

        await page.click("#W0wltc").catch(() => null);
        await page.click("[id*=__] > div > div > div.wWOJcd > div.r21Kzd");

        await page.waitForSelector("[id*=__] > div > div > span.ILfuVd > span");

        const html = await page.content();
        const $ = cheerio.load(html);

        const question = $("[id^=exacc_] > span").first().text();
        let answer = $("[id*=__] > div > div > span.ILfuVd > span")
          .first()
          .text();

        interaction.followUp(`So you want to know ${question.toLowerCase()}`);
        await setTimeout(3000);
        interaction.followUp(`${answer} <:foxnote:1014517679576592505>`);

        await browser.close();
      } catch (e) {
        interaction.followUp("I don't know <:LumineThink:1014510903665889331>");
        console.log(e);
        return browser.close();
      }
    },
  },
};
