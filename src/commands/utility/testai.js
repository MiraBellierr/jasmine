const puppeteer = require("puppeteer");

module.exports = {
  name: "testai",
  description: "test",
  run: async (client, message, args) => {
    if (!args.length) return;

    const msg = args.join(" ");

    (async () => {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();

      // Navigate the page to a URL
      await page.goto("https://www.roastedby.ai/");

      await page.type(".inputBox", "im cute");
      await page.click(".bg-blue-500");
      await page.waitForSelector("div.flex:nth-child(3) > div:nth-child(1)");
      const aiMessages = await page.$$(".message-ai");
      const lastMessage = await aiMessages[aiMessages.length - 1].evaluate(
        (element) => element.textContent
      );

      message.channel.send(lastMessage);

      await browser.close();
    })();
  },
};
