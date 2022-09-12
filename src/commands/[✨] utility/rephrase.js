const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { setTimeout } = require("timers/promises");
const errors = require("../../utils/errors");

module.exports = {
  name: "rephrase",
  description: "let the bot rephrase something for you",
  category: "[✨] utility",
  usage: "<input>",
  run: async (client, message, args) => {
    if (!args.length) return errors.argsError(module.exports, client, message);

    const input = args.join(" ");

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const m = await message.reply(
      "Rephrasing... <:foxnote:1014517679576592505>"
    );

    await page.goto("https://quillbot.com/", { waitUntil: "networkidle2" });
    await page.click(".MuiInput-root");
    await setTimeout(500);
    await page.click(".MuiMenu-list > li:nth-child(2)");
    await setTimeout(3000);
    await page.click("#inputText", { clickCount: 3, delay: 100 });
    await page.type("#inputText", input);
    await page.click(".quillArticleBtn");
    await setTimeout(5000);

    const html = await page.content();
    const $ = cheerio.load(html);

    const text = $("#editable-content-within-article").first().text();

    m.edit(text);

    await browser.close();
  },
  interaction: {
    data: {
      name: "rephrase",
      description: "let the bot rephrase something for you",
      type: 1,
      options: [
        {
          name: "input",
          description: "the input to rephrase",
          type: 3,
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      const input = interaction.options.getString("input");

      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();

      interaction.reply("Rephrasing... <:foxnote:1014517679576592505>");

      await page.goto("https://quillbot.com/", { waitUntil: "networkidle2" });
      await page.click(".MuiInput-root");
      await setTimeout(500);
      await page.click(".MuiMenu-list > li:nth-child(2)");
      await setTimeout(3000);
      await page.click("#inputText", { clickCount: 3, delay: 100 });
      await page.type("#inputText", input);
      await page.click(".quillArticleBtn");
      await setTimeout(5000);

      const html = await page.content();
      const $ = cheerio.load(html);

      const text = $("#editable-content-within-article").first().text();

      interaction.editReply(text);

      await browser.close();
    },
  },
};
