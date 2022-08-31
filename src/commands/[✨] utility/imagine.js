const puppeteer = require("puppeteer");
const ch = require("cheerio");
const fs = require("fs");
const url = "https://imageupscaler.com/ai-image-generator/";
const { setTimeout } = require("timers/promises");
const error = require("../../utils/errors");

module.exports = {
  name: "imagine",
  description: "let the bot imagine something",
  usage: "<input>",
  run: async (client, message, args) => {
    if (!args.length) return error.argsError(module.exports, client, message);

    const input = args.join(" ");

    message.reply("I will draw it now, might take a while...");

    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url);
    await page.type(".autogrow", input);
    await page.select(".js-image-type", "Photo");
    await setTimeout(2000);
    await page.click("button.btn");
    await page.waitForSelector(".block-after > img");

    const html = await page.content();

    const $ = ch.load(html);

    const pic = $(".block-after > img").attr("src");

    const src = await page.goto(pic);

    const random = Math.floor(Math.random() * 1000000);

    fs.writeFile(
      `./src/images/${random}.png`,
      await src.buffer(),
      "base64",
      function (err) {
        if (err) throw err;
        console.log("File saved.");
        browser.close();
        message.channel.send({ files: [`./src/images/${random}.png`] });
      }
    );
  },
};
