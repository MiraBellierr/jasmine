const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const error = require("../../utils/errors");
const { Paginate } = require("../../utils/pagination");

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
        "[id*=__] > div > div > div.wWOJcd > div.r21Kzd",
        { timeout: 10000 }
      );

      await page.click("#W0wltc").catch(() => null);
      await page.evaluate(() => {
        Array.from(
          document.querySelectorAll(
            "[id*=__] > div > div > div.wWOJcd > div.r21Kzd"
          )
        ).forEach((elem) => {
          elem.click();
        });
      });

      await page.waitForSelector("[id*=__] > div > div > span.ILfuVd > span", {
        timeout: 10000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      let answers = [];
      const questions = [];

      $("[id^=exacc_] > span").each(function () {
        questions.push($(this).text());
      });

      $("[id*=__]").each(function () {
        if ($(this).find("div > div > div.iKJnec").text()) {
          answers.push($(this).find("div > div > div.iKJnec").first().text());
        } else if (
          $(this)
            .find(
              "div > div > div.webanswers-webanswers_table__webanswers-table > table > tbody > tr:nth-child(2) > td"
            )
            .text()
        ) {
          answers.push(
            $(this)
              .find(
                "div > div > div.webanswers-webanswers_table__webanswers-table > table > tbody > tr:nth-child(2) > td"
              )
              .first()
              .text()
          );
        } else if ($(this).find(".co8aDb").text()) {
          const header = `${$(this).find(".co8aDb").text()}`;
          let lists = [];

          $(this)
            .find("li.TrT0Xe")
            .each(function () {
              lists.push($(this).text());
            });

          lists = [...new Set(lists)];

          answers.push(
            `${header}\n${lists.map((list) => `• ${list}`).join("\n")}`
          );
        } else if ($(this).find("div > div > span.ILfuVd > span").text()) {
          answers.push($(this).find("div > div > span.ILfuVd > span").text());
        }
      });

      answers = [...new Set(answers)];
      const text = [];

      for (let i = 0; i < questions.length; i++) {
        if (answers[i] && answers[i].length > 35) {
          text.push(
            `So you want to know ${questions[i].toLowerCase()}\n\n${answers[i]}`
          );
        }
      }

      new Paginate(client, message, text).init();

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
          "[id*=__] > div > div > div.wWOJcd > div.r21Kzd",
          { timeout: 10000 }
        );

        await page.click("#W0wltc").catch(() => null);
        await page.evaluate(() => {
          Array.from(
            document.querySelectorAll(
              "[id*=__] > div > div > div.wWOJcd > div.r21Kzd"
            )
          ).forEach((elem) => {
            elem.click();
          });
        });

        await page.waitForSelector(
          "[id*=__] > div > div > span.ILfuVd > span",
          { timeout: 10000 }
        );

        const html = await page.content();
        const $ = cheerio.load(html);

        let answers = [];
        const questions = [];

        $("[id^=exacc_] > span").each(function () {
          questions.push($(this).text());
        });

        $("[id*=__]").each(function () {
          if ($(this).find("div > div > div.iKJnec").text()) {
            answers.push($(this).find("div > div > div.iKJnec").first().text());
          } else if (
            $(this)
              .find(
                "div > div > div.webanswers-webanswers_table__webanswers-table > table > tbody > tr:nth-child(2) > td"
              )
              .text()
          ) {
            answers.push(
              $(this)
                .find(
                  "div > div > div.webanswers-webanswers_table__webanswers-table > table > tbody > tr:nth-child(2) > td"
                )
                .first()
                .text()
            );
          } else if ($(this).find(".co8aDb").text()) {
            const header = `${$(this).find(".co8aDb").text()}`;
            let lists = [];

            $(this)
              .find("li.TrT0Xe")
              .each(function () {
                lists.push($(this).text());
              });

            lists = [...new Set(lists)];

            answers.push(
              `${header}\n${lists.map((list) => `• ${list}`).join("\n")}`
            );
          } else if ($(this).find("div > div > span.ILfuVd > span").text()) {
            answers.push($(this).find("div > div > span.ILfuVd > span").text());
          }
        });

        answers = [...new Set(answers)];
        const text = [];

        for (let i = 0; i < questions.length; i++) {
          if (answers[i] && answers[i].length > 35) {
            text.push(
              `So you want to know ${questions[i].toLowerCase()}\n\n${
                answers[i]
              }`
            );
          }
        }

        new Paginate(client, interaction, text).init();

        await browser.close();
      } catch (e) {
        interaction.followUp("I don't know <:LumineThink:1014510903665889331>");
        console.log(e);
        return browser.close();
      }
    },
  },
};
