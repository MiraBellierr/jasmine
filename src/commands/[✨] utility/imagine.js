const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const errors = require("../../utils/errors");
const fs = require("fs");

module.exports = {
  name: "imagine",
  description: "let the bot draw something for you",
  usage: "<input>",
  run: async (client, message, args) => {
    if (!args.length) return errors.argsError(module.exports, client, message);

    const prompt = args.join(" ");

    const m = await message.reply(
      "Let me draw it for you... might take a while <:foxnote:1014517679576592505>"
    );

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.craiyon.com/");

    await page
      .click(
        "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button:nth-child(2)"
      )
      .catch(() => null);
    await page.type("#prompt", prompt);
    await page.click(
      "#app > div > div > div.mt-4.flex.w-full.justify-center.rounded-lg.rounded-b-none > button"
    );

    const interval = setInterval(async function () {
      const html = await page.content();
      const $ = cheerio.load(html);
      const count = $(".text-right").text();

      m.edit(
        `Let me draw it for you... might take a while (${count}) <:foxnote:1014517679576592505>`
      );
    }, 5000);

    await page.waitForSelector(
      "#app > div > div > div.aspect-w-1.aspect-h-1 > div > div > div > div.grid.grid-cols-3.gap-2 > div:nth-child(1) > img",
      { timeout: 120000 }
    );

    clearInterval(interval);

    m.edit(
      "Let me draw it for you... might take a while (done) <:foxnote:1014517679576592505>"
    );

    const html = await page.content();
    const $ = cheerio.load(html);

    const img = $(
      "#app > div > div > div.aspect-w-1.aspect-h-1 > div > div > div > div.grid.grid-cols-3.gap-2 > div:nth-child(1) > img"
    ).attr("src");

    const src = await page.goto(img);
    const random = Math.floor(Math.random() * 100000000000);

    fs.writeFile(
      `./src/images/${random}.jpeg`,
      await src.buffer(),
      null,
      async (err) => {
        if (err) {
          await browser.close();
          console.log(err);
        }
      }
    );

    message.reply({ files: [`./src/images/${random}.jpeg`] });
  },
  interaction: {
    data: {
      name: "imagine",
      description: "Let the bot draw it for you",
      type: 1,
      options: [
        {
          name: "input",
          description: "What you want the bot to draw",
          type: 3,
          required: true,
        },
      ],
    },
    run: async (client, interaction) => {
      const prompt = interaction.options.getString("input");

      interaction.reply(
        "Let me draw it for you... might take a while <:foxnote:1014517679576592505>"
      );

      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();

      await page.goto("https://www.craiyon.com/");

      await page
        .click(
          "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button:nth-child(2)"
        )
        .catch(() => null);
      await page.type("#prompt", prompt);
      await page.click(
        "#app > div > div > div.mt-4.flex.w-full.justify-center.rounded-lg.rounded-b-none > button"
      );

      const interval = setInterval(async function () {
        const html = await page.content();
        const $ = cheerio.load(html);
        const count = $(".text-right").text();

        interaction.editReply(
          `Let me draw it for you... might take a while (${count}) <:foxnote:1014517679576592505>`
        );
      }, 5000);

      await page.waitForSelector(
        "#app > div > div > div.aspect-w-1.aspect-h-1 > div > div > div > div.grid.grid-cols-3.gap-2 > div:nth-child(1) > img",
        { timeout: 120000 }
      );

      clearInterval(interval);

      interaction.editReply(
        "Let me draw it for you... might take a while (done) <:foxnote:1014517679576592505>"
      );

      const html = await page.content();
      const $ = cheerio.load(html);

      const img = $(
        "#app > div > div > div.aspect-w-1.aspect-h-1 > div > div > div > div.grid.grid-cols-3.gap-2 > div:nth-child(1) > img"
      ).attr("src");

      const src = await page.goto(img);
      const random = Math.floor(Math.random() * 100000000000);

      fs.writeFile(
        `./src/images/${random}.jpeg`,
        await src.buffer(),
        null,
        async (err) => {
          if (err) {
            await browser.close();
            console.log(err);
          }
        }
      );

      interaction.followUp({ files: [`./src/images/${random}.jpeg`] });
    },
  },
};
