const axios = require("axios");
const Discord = require("discord.js");
const https = require("https");

// delete element in array
const deleteElement = (array, element) => {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }

  return array;
};

const camelCaseToNormal = (str) => {
  return str
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const splitMessage = (
  text,
  { maxLength = 2_000, char = "\n", prepend = "", append = "" } = {},
) => {
  text = Discord.verifyString(text);

  if (text.length <= maxLength) {
    return [text];
  }

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

  if (splitText.some((elem) => elem.length > maxLength)) {
    throw new RangeError("SPLIT_MAX_LEN");
  }

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
};

const formatDate = (date) => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const formatTime = (date) => {
  const options = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const nekoapi = async (endpoint) => {
  const res = await axios({
    method: "get",
    url: `https://nekos.best/api/v2/${endpoint}`,
  });

  return res.data.results[0].url;
};

const checkIfImage = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const contentType = res.headers["content-type"];
        resolve(contentType.startsWith("image/"));
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const getProgBar = (current, max, length) => {
  const curBer = Math.floor((current / max) * length);
  let str = "";

  for (let i = 0; i < length; i++) {
    str += i < curBer ? "■" : "□";
  }

  return str;
};
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

module.exports = {
  splitMessage,
  formatDate,
  formatTime,
  nekoapi,
  checkIfImage,
  deleteElement,
  getProgBar,
  asyncForEach,
  camelCaseToNormal,
};
