const axios = require("axios");
const request = require("request").defaults({ encoding: null });
const Discord = require("discord.js");

// delete element in array
const deleteElement = (array, element) => {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }

  return array;
};

const splitMessage = (
  text,
  { maxLength = 2_000, char = "\n", prepend = "", append = "" } = {}
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
    url: `https://www.nekos.life/api/v2/img/${endpoint}`,
  });

  if (!res.data.url) {
    const links = require("../database/json/roleplay.json");

    const random =
      links[endpoint][Math.floor(Math.random() * links[endpoint].length)];

    return random;
  }

  return res.data.url;
};

const checkIfImage = (url) => {
  return new Promise((resolve) => {
    request(url, (err, res) => {
      if (err) {
        resolve(false);
      }
      if (res.statusCode !== 200) {
        resolve(false);
      }
      if (res.headers["content-type"].startsWith("image")) {
        resolve(true);
      }

      resolve(false);
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
};
