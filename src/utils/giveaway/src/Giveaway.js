const EventEmitter = require("events");
const Discord = require("discord.js");
const constants = require("../../constants");
const schemas = require("../../../database/schemas");

class Giveaway extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this.database = [];
  }

  start(options) {
    this.options = {
      id: `${Math.floor(Math.random() * new Date().getTime())}`,
      channel: options.channel,
      host: options.host,
      prize: options.prize,
      winnerCount: options.winnerCount,
      entries: 0,
      duration: options.duration,
      participants: [],
      winners: [],
      startAt: Math.floor(new Date().getTime() / 1000),
      endAt: Math.floor((new Date().getTime() + options.duration) / 1000),
      ended: false,
    };

    this.sendEmbed();
  }

  async sendEmbed() {
    this.options.embed = await this.options.channel.send(this.generateEmbed());
    this.addToDatabase();
  }

  generateEmbed() {
    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: this.options.host.username,
        iconURL: this.options.host.displayAvatarURL(),
      })
      .setTitle("Giveaway started!")
      .setDescription(
        `${constants.giveaway.prizeEmote} **Price:** ${this.options.prize}\n${
          constants.giveaway.hostEmote
        } **Host:** ${this.options.host.toString()}\n${
          constants.giveaway.entriesEmote
        } **Entries:** ${this.options.entries}\n${
          constants.giveaway.winnerEmote
        } **Winner(s):** ${this.options.winnerCount}\n${
          constants.giveaway.durationEmote
        } **Ends:** <t:${Math.floor(this.options.endAt)}:R>`
      )
      .setThumbnail("https://cdn3.emoji.gg/emojis/2659-tada-purple.gif")
      .setColor("#DA70D6");

    const enterButton = new Discord.ButtonBuilder()
      .setCustomId(this.options.id)
      .setLabel("Enter")
      .setStyle(Discord.ButtonStyle.Primary);

    const row = new Discord.ActionRowBuilder().addComponents(enterButton);

    return { embeds: [embed], components: [row] };
  }

  generateEndEmbed() {
    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: this.options.host.username,
        iconURL: this.options.host.displayAvatarURL(),
      })
      .setTitle("Giveaway ended!")
      .setDescription(
        `${constants.giveaway.prizeEmote} **Price:** ${this.options.prize}\n${
          constants.giveaway.hostEmote
        } **Host:** ${this.options.host.toString()}\n${
          constants.giveaway.winnerEmote
        } **Winner(s):** ${this.options.winners
          .map((w) => `<@${w.id}>`)
          .join(", ")}\n${
          constants.giveaway.durationEmote
        } **Ends:** <t:${Math.floor(this.options.endAt)}:R>`
      )
      .setColor("#DA70D6");

    this.options.embed.edit({ embeds: [embed] });
  }

  winnerAnnounce() {
    const embed = new Discord.EmbedBuilder()
      .setDescription(
        `[Giveaway link](${Discord.messageLink(
          this.options.channel.id,
          this.options.embed.id,
          this.options.channel.guild.id
        )})`
      )
      .setColor(Discord.Colors.DarkButNotBlack);

    this.options.channel.send({
      content: `Congratulations to ${this.options.winners
        .map((w) => `<@${w.id}>`)
        .join(", ")} for winning **${this.options.prize}**!`,
      embeds: [embed],
    });
  }

  noWinnerAnnounce() {
    const embed = new Discord.EmbedBuilder()
      .setDescription(
        `[Giveaway link](${Discord.messageLink(
          this.options.channel.id,
          this.options.embed.id,
          this.options.channel.guild.id
        )})`
      )
      .setColor(Discord.Colors.DarkButNotBlack);

    this.options.channel.send({
      content: `Not enough participants.`,
      embeds: [embed],
    });
  }

  generateInvalidEmbed() {
    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: this.options.host.username,
        iconURL: this.options.host.displayAvatarURL(),
      })
      .setTitle("Giveaway ended!")
      .setDescription(
        `${constants.giveaway.prizeEmote} **Price:** ${this.options.prize}\n${
          constants.giveaway.hostEmote
        } **Host:** ${this.options.host.toString()}\n${
          constants.giveaway.winnerEmote
        } **Winner(s):** No Winner\n${
          constants.giveaway.durationEmote
        } **Ends:** <t:${Math.floor(this.options.endAt)}:R>`
      )
      .setColor("#DA70D6");

    this.options.embed.edit({ embeds: [embed] });
  }

  addToDatabase() {
    schemas.Giveaway().create({
      messageID: this.options.embed.id,
      options: JSON.stringify(this.options),
    });
  }

  updateDatabase() {
    schemas.Giveaway().update(
      {
        options: JSON.stringify(this.options),
      },
      { where: { messageID: this.options.embed.id } }
    );
  }

  async getDatabase() {
    let giveawayDatabase = await schemas.Giveaway().findAll();

    giveawayDatabase = giveawayDatabase.map((g) =>
      JSON.parse(g.dataValues.options)
    );

    return giveawayDatabase;
  }

  async getGiveaway(messageID) {
    const giveaway = await schemas
      .Giveaway()
      .findOne({ where: { messageID: messageID } });

    return JSON.parse(giveaway.get("options"));
  }

  roll() {
    if (this.options.entries < this.options.winnerCount) {
      this.noWinnerAnnounce();
      this.generateInvalidEmbed();
      return;
    }

    for (let i = 0; i < this.options.winnerCount; i++) {
      let winner = this.options.participants.random();

      while (this.options.winners.has(winner.id)) {
        winner = this.options.participants.random();
      }

      this.options.winners.set(winner.id, winner);
    }

    this.winnerAnnounce();
    this.generateEndEmbed();
  }

  async end(g) {
    const temp = new Discord.Collection();
    if (g.participants.length < 1) {
      g.participants = new Discord.Collection();
    } else {
      g.participants.forEach((participant) => {
        temp.set(participant.id, participant);
      });

      g.participants = temp;
    }
    if (g.winners.length < 1) g.winners = new Discord.Collection();

    await this.update(g);
    if (this.options.ended) return;

    this.options.ended = true;

    this.updateDatabase();
    this.roll();
  }

  async stop(channel, messageID) {
    if (!messageID) {
      let giveawayDatabase = await schemas
        .Giveaway()
        .findAll({ order: [["createdAt", "DESC"]] });

      giveawayDatabase = giveawayDatabase
        .map((g) => JSON.parse(g.dataValues.options))
        .filter((g) => g.channel.id === channel.id && !g.ended);

      if (!giveawayDatabase.length) return channel.send("No giveaways found.");

      const g = giveawayDatabase[0];

      g.winners = new Discord.Collection();

      const temp = new Discord.Collection();
      if (g.participants.length < 1) {
        g.participants = new Discord.Collection();
      } else {
        g.participants.forEach((participant) => {
          temp.set(participant.id, participant);
        });

        g.participants = temp;
      }
      g.channel = await this.client.channels.fetch(g.channel.id);
      g.host = await this.client.users.fetch(g.host.id);
      g.embed = await g.channel.messages.fetch(g.embed.id);
      g.ended = true;

      this.options = g;

      this.roll();
    } else {
      let giveawayDatabase = await schemas
        .Giveaway()
        .findAll({ order: [["createdAt", "DESC"]] });

      giveawayDatabase = giveawayDatabase
        .map((g) => JSON.parse(g.dataValues.options))
        .filter(
          (g) =>
            g.channel.id === channel.id && g.embed.id === messageID && !g.ended
        );

      if (!giveawayDatabase.length) return channel.send("No giveaways found.");

      const g = giveawayDatabase[0];

      g.winners = new Discord.Collection();

      const temp = new Discord.Collection();
      if (g.participants.length < 1) {
        g.participants = new Discord.Collection();
      } else {
        g.participants.forEach((participant) => {
          temp.set(participant.id, participant);
        });

        g.participants = temp;
      }
      g.channel = await this.client.channels.fetch(g.channel.id);
      g.host = await this.client.users.fetch(g.host.id);
      g.embed = await g.channel.messages.fetch(g.embed.id);
      g.ended = true;

      this.options = g;

      this.roll();
    }

    this.updateDatabase();
  }

  async reroll(channel, messageID) {
    if (!messageID) {
      let giveawayDatabase = await schemas
        .Giveaway()
        .findAll({ order: [["createdAt", "DESC"]] });

      giveawayDatabase = giveawayDatabase
        .map((g) => JSON.parse(g.dataValues.options))
        .filter(
          (g) =>
            g.channel.id === channel.id && g.ended && g.participants.length > 1
        );

      if (!giveawayDatabase.length) return channel.send("No giveaways found.");

      const g = giveawayDatabase[0];

      g.winners = new Discord.Collection();

      const temp = new Discord.Collection();
      if (g.participants.length < 1) {
        g.participants = new Discord.Collection();
      } else {
        g.participants.forEach((participant) => {
          temp.set(participant.id, participant);
        });

        g.participants = temp;
      }
      g.channel = await this.client.channels.fetch(g.channel.id);
      g.host = await this.client.users.fetch(g.host.id);
      g.embed = await g.channel.messages.fetch(g.embed.id);

      this.options = g;

      this.roll();
    } else {
      let giveawayDatabase = await schemas
        .Giveaway()
        .findAll({ order: [["createdAt", "DESC"]] });

      giveawayDatabase = giveawayDatabase
        .map((g) => JSON.parse(g.dataValues.options))
        .filter(
          (g) =>
            g.channel.id === channel.id &&
            g.embed.id === messageID &&
            g.ended &&
            g.participants.length > 1
        );

      if (!giveawayDatabase.length) return channel.send("No giveaways found.");

      const g = giveawayDatabase[0];

      g.winners = new Discord.Collection();

      const temp = new Discord.Collection();
      if (g.participants.length < 1) {
        g.participants = new Discord.Collection();
      } else {
        g.participants.forEach((participant) => {
          temp.set(participant.id, participant);
        });

        g.participants = temp;
      }
      g.channel = await this.client.channels.fetch(g.channel.id);
      g.host = await this.client.users.fetch(g.host.id);
      g.embed = await g.channel.messages.fetch(g.embed.id);

      this.options = g;

      this.roll();
    }

    this.updateDatabase();
  }

  async update(op) {
    this.options = op;
    this.options.host = await this.client.users.fetch(this.options.host.id);
    this.options.channel = await this.client.channels.fetch(
      this.options.channel.id
    );

    this.options.embed = await this.options.channel.messages.fetch(
      this.options.embed.id
    );
    this.options.entries = this.options.participants.size;

    this.updateDatabase();

    this.options.embed.edit(this.generateEmbed());
  }

  init() {
    setInterval(async () => {
      await this.checkGiveaway();
    }, 1000);
  }

  async checkGiveaway() {
    (await this.getDatabase()).forEach(async (g) => {
      if (g.ended) {
        return;
      }

      if (g.endAt < new Date().getTime() / 1000) {
        await this.end(g);
      }
    });
  }
}

module.exports = Giveaway;
