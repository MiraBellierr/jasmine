const Discord = require("discord.js");
const axios = require("axios");

class Util {
	constructor() {}

	splitMessage(
		text,
		{ maxLength = 2_000, char = "\n", prepend = "", append = "" } = {}
	) {
		text = Discord.Util.verifyString(text);

		if (text.length <= maxLength) return [text];

		let splitText = [text];

		if (Array.isArray(char)) {
			while (
				char.length > 0 &&
				splitText.some((elem) => elem.length > maxLength)
			) {
				const currentChar = char.shift();

				if (currentChar instanceof RegExp) {
					splitText = splitText.flatMap((chunk) => chunk.match(currentChar));
				} else {
					splitText = splitText.flatMap((chunk) => chunk.split(currentChar));
				}
			}
		} else {
			splitText = text.split(char);
		}

		if (splitText.some((elem) => elem.length > maxLength))
			throw new RangeError("SPLIT_MAX_LEN");

		const messages = [];
		let msg = "";

		for (const chunk of splitText) {
			if (msg && (msg + char + chunk + append).length > maxLength) {
				messages.push(msg + append);
				msg = prepend;
			}

			msg += (msg && msg !== prepend ? char : "") + chunk;
		}

		return messages.concat(msg).filter((m) => m);
	}

	formatDate(date) {
		const options = {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			timeZone: "UTC",
		};

		return new Intl.DateTimeFormat("en-US", options).format(date);
	}

	formatTime(date) {
		const options = {
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		};
		return new Intl.DateTimeFormat("en-US", options).format(date);
	}

	async nekoapi(endpoint) {
		const res = await axios({
			method: "get",
			url: `https://www.nekos.life/api/v2/img/${endpoint}`,
		});

		if (!res.data.url) {
			const links = {
				bite: [
					"https://media1.tenor.com/images/432a41a6beb3c05953c769686e8c4ce9/tenor.gif?itemid=4704665",
					"https://media1.tenor.com/images/1169d1ab96669e13062c1b23ce5b9b01/tenor.gif?itemid=9035033",
					"https://media1.tenor.com/images/418a2765b0bf54eb57bab3fde5d83a05/tenor.gif?itemid=12151511",
					"https://media1.tenor.com/images/6b42070f19e228d7a4ed76d4b35672cd/tenor.gif?itemid=9051585",
					"https://media1.tenor.com/images/f308e2fe3f1b3a41754727f8629e5b56/tenor.gif?itemid=12390216",
					"https://media1.tenor.com/images/6ab39603ef0dd6dbfc78ba20885b991f/tenor.gif?itemid=8220087",
					"https://media1.tenor.com/images/83271613ed73fd70f6c513995d7d6cfa/tenor.gif?itemid=4915753",
					"https://media1.tenor.com/images/34a08d324868d33358e0a465040f210e/tenor.gif?itemid=11961581",
					"https://media1.tenor.com/images/7cc64070f618bdf171b0e45a57cf1b12/tenor.gif?itemid=17054824",
					"https://media1.tenor.com/images/2735c3a10b0b09871cd5d6bded794f0d/tenor.gif?itemid=14399284",
				],
				blush: [
					"https://media1.tenor.com/images/a8d262bea6aa70742b393b08f02c5710/tenor.gif?itemid=12830507",
					"https://media1.tenor.com/images/b00fe041997afa8fff0734a1fb8dd2a4/tenor.gif?itemid=13768377",
					"https://media1.tenor.com/images/5ea40ca0d6544dbf9c0074542810e149/tenor.gif?itemid=14841901",
					"https://media1.tenor.com/images/274fc34d3add3ce4cbb5716cb4f94f4f/tenor.gif?itemid=5841198",
					"https://media1.tenor.com/images/09d75740089598b54342df3641dbbffc/tenor.gif?itemid=5615361",
					"https://media1.tenor.com/images/9eba52d0506b552b7ef6a1981c0cfcff/tenor.gif?itemid=8680309",
					"https://media1.tenor.com/images/f62cae32b30d364bf0a8a1e7432c2ddf/tenor.gif?itemid=10198325",
					"https://media.tenor.com/images/ec68d88a7a6605e17395fc67a132d83e/tenor.gif",
					"https://media1.tenor.com/images/e8f3c6c5ddbd1637f536c4fe45479894/tenor.gif?itemid=12348314",
					"https://media1.tenor.com/images/fdd56c120f59f899f8c34605165896a8/tenor.gif?itemid=12348305",
				],
			};

			const random =
				links[endpoint][Math.floor(Math.random() * links[endpoint].length)];

			return random;
		}

		return res.data.url;
	}
}

module.exports = Util;
