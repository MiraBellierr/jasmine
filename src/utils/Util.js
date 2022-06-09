const Discord = require("discord.js");

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
}

module.exports = Util;
