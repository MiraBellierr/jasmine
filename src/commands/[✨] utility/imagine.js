const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const errors = require("../../utils/errors");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const canvas = createCanvas(900, 900);
const ctx = canvas.getContext("2d");

module.exports = {
  name: "imagine",
  description: "let the bot draw something for you",
  category: "[✨] utility",
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
      "Let me draw it for you... might take a while (almost...) <:foxnote:1014517679576592505>"
    );

    const html = await page.content();
    const $ = cheerio.load(html);

    const images = [];

    images.push(
      $("div.aspect-w-1:nth-child(1) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.grid:nth-child(1) > div:nth-child(2) > img:nth-child(1)").attr(
        "src"
      )
    );
    images.push(
      $("div.aspect-w-1:nth-child(3) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(4) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(5) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(6) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(7) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(8) > img:nth-child(1)").attr("src")
    );
    images.push(
      $("div.aspect-w-1:nth-child(9) > img:nth-child(1)").attr("src")
    );

    let x = 0;
    let y = 0;

    for (const img of images) {
      const page = await browser.newPage();
      const src = await page.goto(img);

      await loadImage(await src.buffer()).then((image) => {
        ctx.drawImage(image, x, y, 300, 300);
      });

      x += 300;

      if (x > 600) {
        x = 0;
        y += 300;
      }
    }

    const random = Math.floor(Math.random() * 100000000000);

    fs.writeFile(
      `./src/images/${random}.jpeg`,
      canvas.toBuffer(),
      null,
      (err) => {
        if (err) {
          console.log(err);
        }
        console.log(`done - ${random}.jpeg`);
      }
    );

    m.edit(
      "Let me draw it for you... might take a while (done) <:foxnote:1014517679576592505>"
    );

    message.reply({ files: [`./src/images/${random}.jpeg`] });

    await browser.close();
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
        "Let me draw it for you... might take a while (almost...) <:foxnote:1014517679576592505>"
      );

      const html = await page.content();
      const $ = cheerio.load(html);

      const images = [];

      images.push(
        $("div.aspect-w-1:nth-child(1) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.grid:nth-child(1) > div:nth-child(2) > img:nth-child(1)").attr(
          "src"
        )
      );
      images.push(
        $("div.aspect-w-1:nth-child(3) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(4) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(5) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(6) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(7) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(8) > img:nth-child(1)").attr("src")
      );
      images.push(
        $("div.aspect-w-1:nth-child(9) > img:nth-child(1)").attr("src")
      );

      let x = 0;
      let y = 0;

      for (const img of images) {
        const page = await browser.newPage();
        const src = await page.goto(img);

        await loadImage(await src.buffer()).then((image) => {
          ctx.drawImage(image, x, y, 300, 300);
        });

        x += 300;

        if (x > 600) {
          x = 0;
          y += 300;
        }
      }

      const random = Math.floor(Math.random() * 100000000000);

      fs.writeFile(
        `./src/images/${random}.jpeg`,
        canvas.toBuffer(),
        null,
        (err) => {
          if (err) {
            console.log(err);
          }
          console.log(`done - ${random}.jpeg`);
        }
      );

      interaction.editReply(
        "Let me draw it for you... might take a while (done) <:foxnote:1014517679576592505>"
      );

      interaction.followUp({ files: [`./src/images/${random}.jpeg`] });

      await browser.close();
    },
  },
};
