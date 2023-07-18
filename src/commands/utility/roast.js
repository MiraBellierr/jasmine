const puppeteer = require("puppeteer");

module.exports = {
  name: "roast",
  description: "test him",
  run: async (client, message) => {
    let reply;

    if (message.reference && message.reference.messageId) {
      const msg = message.channel.messages.cache.find(
        (mssg) => mssg.id === message.reference.messageId
      );

      reply = msg;
    } else {
      return;
    }

    (async () => {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Navigate the page to a URL
      await page.goto("https://www.roastedby.ai/");

      await page.type(".inputBox", reply.content);
      await page.click(".bg-blue-500");
      await page.waitForSelector("div.flex:nth-child(3) > div:nth-child(1)");
      const aiMessages = await page.$$(".message-ai");
      const lastMessage = await aiMessages[aiMessages.length - 1].evaluate(
        (element) => element.textContent
      );

      reply.reply(lastMessage);

      await browser.close();
    })();
  },
};
