const puppeteer = require("puppeteer");
const ch = require("cheerio");
const fs = require("fs");
const url = "https://www.craiyon.com/";
const error = require("../../utils/errors");

module.exports = {
  name: "imagine",
  description: "let the bot imagine something",
  usage: "<input>",
  run: async (client, message, args) => {
    if (!args.length) return error.argsError(module.exports, client, message);

    const input = args.join(" ");

    const m = await message.reply("I will draw it now, might take a while...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url);
    await page.type("#prompt", input);
    await page.click("button.my-2:nth-child(2)");

    const updateMessage = setInterval(async function () {
      const earlyHtml = await page.content();
      const $$ = ch.load(earlyHtml);
      const count = $$(".text-right", earlyHtml).text();
      m.edit(`I will draw it now, might take a while... (${count}s)`);
    }, 5000);
    await page
      .waitForSelector("div.aspect-w-1:nth-child(1) > img", { timeout: 120000 })
      .catch((e) => {
        console.log(e);
        message.reply("Couldn't draw it, sowwy.");
        browser.close();
      });

    clearInterval(updateMessage);

    m.edit("I will draw it now, might take a while... (done)");

    const html = await page.content();

    const $ = ch.load(html);

    const pic = $("div.aspect-w-1:nth-child(1) > img").attr("src");

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
