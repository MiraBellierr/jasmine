const puppeteer = require("puppeteer");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

      await page.type(
        "div[class='inputBox border text-black rounded-lg py-2 px-3 w-3/4 mr-2 font-normal text-sm bg-transparent']",
        reply.content
      );
      await page.click(
        "button[class='bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition-colors']"
      );
      await wait(3000);

      const aiMessages = await page.$$(".message-ai");
      const lastMessage = await aiMessages[aiMessages.length - 1].evaluate(
        (element) => element.textContent
      );

      reply.reply(lastMessage);

      await browser.close();
    })();
  },
};
