const { EventEmitter } = require("events");
const merge = require("deepmerge");
const { writeFile, readFile, exists } = require("fs");
const { promisify } = require("util");
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const Discord = require("discord.js");
const {
  defaultGiveawayMessages,
  defaultManagerOptions,
  defaultRerollOptions,
} = require("./Constants.js");
const Giveaway = require("./Giveaway.js");

class GiveawaysManager extends EventEmitter {
  constructor(client, options, init = true) {
    super();
    if (!client) {
      throw new Error("Client is a required option.");
    }
    this.client = client;
    this.ready = false;
    this.giveaways = [];
    this.options = merge(defaultManagerOptions, options);
    if (init) {
      this._init();
    }
  }

  generateMainEmbed(giveaway, lastChanceEnabled) {
    const embed = new Discord.EmbedBuilder();
    embed
      .setAuthor({ name: giveaway.prize })
      .setColor(
        lastChanceEnabled ? giveaway.lastChance.embedColor : giveaway.embedColor
      )
      .setFooter({
        text: `${giveaway.winnerCount} ${giveaway.messages.winners} • ${giveaway.messages.embedFooter}`,
      })
      .setDescription(
        (lastChanceEnabled ? giveaway.lastChance.content + "\n\n" : "") +
          giveaway.messages.inviteToParticipate +
          "\n" +
          giveaway.remainingTimeText +
          "\n" +
          (giveaway.hostedBy
            ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy)
            : "")
      )
      .setTimestamp(new Date(giveaway.endAt));
    return embed;
  }

  generateEndEmbed(giveaway, winners) {
    let formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");

    const descriptionString = (formattedWinners2) => {
      const winnersString = `${giveaway.messages.winners
        .substr(0, 1)
        .toUpperCase()}${giveaway.messages.winners.substr(
        1,
        giveaway.messages.winners.length
      )}: ${formattedWinners2}`;

      return (
        winnersString +
        "\n" +
        (giveaway.hostedBy
          ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy)
          : "")
      );
    };

    for (
      let i = 1;
      descriptionString(formattedWinners).length > 2048 ||
      giveaway.prize.length +
        giveaway.messages.endedAt.length +
        descriptionString(formattedWinners).length >
        6000;
      i++
    ) {
      formattedWinners = `${formattedWinners.substr(
        0,
        formattedWinners.lastIndexOf(", <@")
      )}, ${i} more`;
    }

    const embed = new Discord.EmbedBuilder();
    embed
      .setAuthor({ name: giveaway.prize })
      .setColor(giveaway.embedColorEnd)
      .setFooter({ text: giveaway.messages.endedAt })
      .setDescription(descriptionString(formattedWinners))
      .setTimestamp(new Date(giveaway.endAt));
    return embed;
  }

  generateNoValidParticipantsEndEmbed(giveaway) {
    const embed = new Discord.EmbedBuilder();
    embed
      .setAuthor({ name: giveaway.prize })
      .setColor(giveaway.embedColorEnd)
      .setFooter({ text: giveaway.messages.endedAt })
      .setDescription(
        giveaway.messages.noWinner +
          "\n" +
          (giveaway.hostedBy
            ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy)
            : "")
      )
      .setTimestamp(new Date(giveaway.endAt).toISOString());
    return embed;
  }

  end(messageID) {
    return new Promise((resolve, reject) => {
      const giveaway = this.giveaways.find((g) => g.messageID === messageID);
      if (!giveaway) {
        return reject(`No giveaway found with ID ${messageID}.`);
      }
      giveaway
        .end()
        .then((winners) => {
          this.emit("giveawayEnded", giveaway, winners);
          resolve();
        })
        .catch(reject);
    });
  }

  async start(channel, options) {
    if (!this.ready) {
      return reject("The manager is not ready yet.");
    }
    options.messages =
      options.messages && typeof options.messages === "object"
        ? merge(defaultGiveawayMessages, options.messages)
        : defaultGiveawayMessages;
    if (!(channel && channel.id)) {
      return reject(`channel is not a valid guildchannel. (val=${channel})`);
    }
    if (!options.time || isNaN(options.time)) {
      return reject(`options.time is not a number. (val=${options.time})`);
    }
    if (typeof options.prize !== "string") {
      return reject(`options.prize is not a string. (val=${options.prize})`);
    }
    if (!Number.isInteger(options.winnerCount) || options.winnerCount < 1) {
      return reject(
        `options.winnerCount is not a positive integer. (val=${options.winnerCount})`
      );
    }
    const giveaway = new Giveaway(this, {
      startAt: Date.now(),
      endAt: Date.now() + options.time,
      winnerCount: options.winnerCount,
      winnerIDs: [],
      channelID: channel.id,
      guildID: channel.guild.id,
      ended: false,
      prize: options.prize,
      hostedBy: options.hostedBy ? options.hostedBy.toString() : null,
      messages: options.messages,
      reaction: options.reaction,
      botsCanWin: options.botsCanWin,
      exemptPermissions: Array.isArray(options.exemptPermissions)
        ? options.exemptPermissions
        : [],
      exemptMembers: options.exemptMembers,
      bonusEntries:
        Array.isArray(options.bonusEntries) &&
        options.bonusEntries.every((elem) => typeof elem === "object")
          ? options.bonusEntries
          : [],
      embedColor: options.embedColor,
      embedColorEnd: options.embedColorEnd,
      extraData: options.extraData,
      lastChance: options.lastChance,
    });
    const embed = this.generateMainEmbed(giveaway);
    const message = await channel.send({
      content: `${giveaway.messages.giveaway}`,
      embeds: [embed],
    });
    message.react(giveaway.reaction);
    giveaway.messageID = message.id;
    this.giveaways.push(giveaway);
    await this.saveGiveaway(giveaway.messageID, giveaway.data);
    return giveaway;
  }

  reroll(messageID, options = {}) {
    return new Promise((resolve, reject) => {
      options = merge(defaultRerollOptions, options);
      const giveaway = this.giveaways.find((g) => g.messageID === messageID);
      if (!giveaway) {
        return reject(`No giveaway found with ID ${messageID}.`);
      }
      giveaway
        .reroll(options)
        .then((winners) => {
          this.emit("giveawayRerolled", giveaway, winners);
          resolve();
        })
        .catch(reject);
    });
  }

  edit(messageID, options = {}) {
    return new Promise((resolve, reject) => {
      const giveaway = this.giveaways.find((g) => g.messageID === messageID);
      if (!giveaway) {
        return reject(`No giveaway found with ID ${messageID}.`);
      }
      giveaway.edit(options).then(resolve).catch(reject);
    });
  }

  async delete(messageID, doNotDeleteMessage = false) {
    const giveaway = this.giveaways.find((g) => g.messageID === messageID);
    if (!giveaway) {
      return reject(`No giveaway found with ID ${messageID}.`);
    }
    if (!(giveaway.channel || doNotDeleteMessage)) {
      return reject(
        `Unable to get the channel of the giveaway with message ID ${giveaway.messageID}.`
      );
    }
    if (!doNotDeleteMessage) {
      await giveaway.fetchMessage().catch((err) => console.error(err));
      if (giveaway.message) {
        giveaway.message.delete();
      }
    }
    this.giveaways = this.giveaways.filter((g) => g.messageID !== messageID);
    await this.deleteGiveaway(messageID);
    this.emit("giveawayDeleted", giveaway);

    return;
  }

  async deleteGiveaway(messageID) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
      "utf-8"
    );
    this.refreshStorage();
    return;
  }

  async refreshStorage() {
    return true;
  }

  async getAllGiveaways() {
    // Whether the storage file exists, or not
    const storageExists = await existsAsync(this.options.storage);
    // If it doesn't exists
    if (storageExists) {
      // If the file exists, read it
      const storageContent = await readFileAsync(this.options.storage);
      try {
        const giveaways = await JSON.parse(storageContent.toString());
        if (Array.isArray(giveaways)) {
          return giveaways;
        } else {
          console.log(storageContent, giveaways);
          throw new SyntaxError(
            "The storage file is not properly formatted (giveaways is not an array)."
          );
        }
      } catch (e) {
        if (e.message === "Unexpected end of JSON input") {
          throw new SyntaxError(
            "The storage file is not properly formatted (Unexpected end of JSON input)."
          );
        } else {
          throw e;
        }
      }
    } else {
      // Create the file with an empty array
      await writeFileAsync(this.options.storage, "[]", "utf-8");
      return [];
    }
  }

  async editGiveaway(_messageID, _giveawayData) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
      "utf-8"
    );
    this.refreshStorage();
    return;
  }

  async saveGiveaway(messageID, giveawayData) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
      "utf-8"
    );
    this.refreshStorage();
    return;
  }

  _checkGiveaway() {
    if (this.giveaways.length <= 0) {
      return;
    }
    this.giveaways.forEach(async (giveaway) => {
      if (giveaway.ended) {
        return;
      }
      if (!giveaway.channel) {
        return;
      }
      if (giveaway.remainingTime <= 0) {
        return this.end(giveaway.messageID).catch((err) => console.error(err));
      }
      await giveaway.fetchMessage().catch((err) => console.error(err));
      if (!giveaway.message) {
        giveaway.ended = true;
        await this.editGiveaway(giveaway.messageID, giveaway.data);
        return;
      }
      const embed = this.generateMainEmbed(
        giveaway,
        giveaway.lastChance.enabled &&
          giveaway.remainingTime < giveaway.lastChance.threshold
      );
      giveaway.message
        .edit({ content: `${giveaway.messages.giveaway}`, embeds: [embed] })
        .catch((err) => console.error(err));
      if (giveaway.remainingTime < this.options.updateCountdownEvery) {
        setTimeout(
          () => this.end.call(this, giveaway.messageID),
          giveaway.remainingTime
        );
      }
      if (
        giveaway.lastChance.enabled &&
        giveaway.remainingTime - giveaway.lastChance.threshold <
          this.options.updateCountdownEvery
      ) {
        setTimeout(() => {
          const embed2 = this.generateMainEmbed(giveaway, true);
          giveaway.message
            .edit({
              content: `${giveaway.messages.giveaway}`,
              embeds: [embed2],
            })
            .catch((err) => console.error(err));
        }, giveaway.remainingTime - giveaway.lastChance.threshold);
      }
    });
  }

  async _handleRawPacket(packet) {
    if (
      !["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)
    ) {
      return;
    }
    const giveaway = this.giveaways.find(
      (g) => g.messageID === packet.d.message_id
    );
    if (!giveaway) {
      return;
    }
    if (giveaway.ended && packet.t === "MESSAGE_REACTION_REMOVE") {
      return;
    }
    const guild = this.client.guilds.cache.get(packet.d.guild_id);
    if (!guild) {
      return;
    }
    if (packet.d.user_id === this.client.user.id) {
      return;
    }
    const member =
      guild.members.cache.get(packet.d.user_id) ||
      (await guild.members
        .fetch(packet.d.user_id)
        .catch((err) => console.error(err)));
    if (!member) {
      return;
    }
    const channel = guild.channels.cache.get(packet.d.channel_id);
    if (!channel) {
      return;
    }
    const message =
      channel.messages.cache.get(packet.d.message_id) ||
      (await channel.messages.fetch(packet.d.message_id));
    if (!message) {
      return;
    }
    const reaction = message.reactions.cache.get(giveaway.reaction);
    if (!reaction) {
      return;
    }
    if (reaction.emoji.name !== packet.d.emoji.name) {
      return;
    }
    if (reaction.emoji.id && reaction.emoji.id !== packet.d.emoji.id) {
      return;
    }
    if (packet.t === "MESSAGE_REACTION_ADD") {
      if (giveaway.ended) {
        return this.emit(
          "endedGiveawayReactionAdded",
          giveaway,
          member,
          reaction
        );
      }
      this.emit("giveawayReactionAdded", giveaway, member, reaction);
    } else {
      this.emit("giveawayReactionRemoved", giveaway, member, reaction);
    }
  }

  async _init() {
    const rawGiveaways = await this.getAllGiveaways();
    rawGiveaways.forEach((giveaway) => {
      this.giveaways.push(new Giveaway(this, giveaway));
    });
    setInterval(() => {
      if (this.client.readyAt) {
        this._checkGiveaway.call(this);
      }
    }, this.options.updateCountdownEvery);
    this.ready = true;
    if (
      !isNaN(this.options.endedGiveawaysLifetime) &&
      typeof this.options.endedGiveawaysLifetime === "number"
    ) {
      const endedGiveaways = this.giveaways.filter(
        (g) =>
          g.ended && g.endAt + this.options.endedGiveawaysLifetime <= Date.now()
      );
      this.giveaways = this.giveaways.filter(
        (g) =>
          !endedGiveaways
            .map((giveaway) => giveaway.messageID)
            .includes(g.messageID)
      );
      for (const giveaway of endedGiveaways) {
        await this.deleteGiveaway(giveaway.messageID);
      }
    }

    this.client.on("raw", (packet) => this._handleRawPacket(packet));
  }
}

module.exports = GiveawaysManager;
