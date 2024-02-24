const schemas = require("../../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../constants");
const set = new Set();
const { setTimeout } = require("timers/promises");
const equipments = require("../../../database/json/equipments.json");
const economies = require("../../../utils/economies");

class Battle {
  constructor(message, user) {
    this.user = user;
    this.message = message;
    this.actions = ["battle started"];
    this.playerPassives = [];
    this.opponentPassives = [];
  }

  async getCharacter() {
    const character = await schemas.character().findOne({
      where: {
        userID: this.user.id,
      },
    });

    if (!character) {
      return null;
    }

    return character.toJSON();
  }

  async getOpponentCharacter(user) {
    const character = await schemas
      .character()
      .findOne({ where: { userID: user.id } });

    if (!character) return null;

    return character.toJSON();
  }

  async getRandomOpponent() {
    const allCharacter = await schemas.character().findAll();
    let randomCharacter =
      allCharacter[Math.floor(Math.random() * allCharacter.length)];

    if (allCharacter.length > 1) {
      while (randomCharacter.get("userID") === this.user.id) {
        randomCharacter =
          allCharacter[Math.floor(Math.random() * allCharacter.length)];
      }
    } else {
      randomCharacter = allCharacter[0];
    }

    return randomCharacter.toJSON();
  }

  async confirmBattle(opponent) {
    const embed = new Discord.EmbedBuilder().setDescription(
      `Hello ${opponent}, ${this.user} wants to challenge you! Do you accept?`,
    );

    const rejectedEmbed = new Discord.EmbedBuilder().setDescription(
      `${this.user}, ${opponent} rejected your challenge!`,
    );

    const acceptedEmbed = new Discord.EmbedBuilder().setDescription(
      `${this.user}, ${opponent} accepted your challenge!`,
    );

    const acceptButton = new Discord.ButtonBuilder()
      .setCustomId("accept")
      .setEmoji("✅")
      .setLabel("Accept")
      .setStyle(Discord.ButtonStyle.Primary);

    const denyButton = new Discord.ButtonBuilder()
      .setCustomId("deny")
      .setEmoji("❎")
      .setLabel("Deny")
      .setStyle(Discord.ButtonStyle.Secondary);

    const actionRow = new Discord.ActionRowBuilder().addComponents(
      acceptButton,
      denyButton,
    );

    const response = await this.message.channel.send({
      content: `${opponent}`,
      embeds: [embed],
      components: [actionRow],
    });

    const collectorFilter = (i) => i.user.id === opponent.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      const actionRowDisabled = new Discord.ActionRowBuilder().addComponents(
        acceptButton.setDisabled(true),
        denyButton.setDisabled(true),
      );

      if (confirmation.customId === "accept") {
        confirmation.update({
          content: " ",
          embeds: [acceptedEmbed],
          components: [actionRowDisabled],
        });

        return true;
      } else {
        confirmation.update({
          content: " ",
          embeds: [rejectedEmbed],
          components: [actionRowDisabled],
        });
        return false;
      }
    } catch (e) {
      const actionRowDisabled = new Discord.ActionRowBuilder().addComponents(
        acceptButton.setDisabled(true),
        denyButton.setDisabled(true),
      );

      response.edit({
        content: `${opponent}`,
        embeds: [rejectedEmbed],
        components: [actionRowDisabled],
      });
    }
  }

  async startOpponent(opponent) {
    this.character = await this.getCharacter();

    if (!this.character) {
      return this.message.channel.send("You haven't registered yet!");
    }

    if (set.has(this.user.id)) {
      return this.message.reply("You are already in a battle!");
    }

    this.opponent = await this.getOpponentCharacter(opponent);

    if (!this.opponent) {
      return this.message.channel.send(
        "The opponent doesn't have a character yet!",
      );
    }

    const confirm = await this.confirmBattle(opponent);

    if (!confirm) return;

    set.add(this.user.id);

    this.character.maxHp = this.character.hp;
    this.opponent.maxHp = this.opponent.hp;

    this.character.crit = 0;
    this.opponent.crit = 0;

    this.opponent.weight = 0;
    this.character.weight = 0;

    await this.registerEquipments();

    if (this.character.agl === this.opponent.agl) {
      this.character.agl += Math.random();
      this.opponent.agl += Math.random();
    }

    this.battleMessage = await this.message.channel.send({
      embeds: [this.battleEmbed()],
    });

    setTimeout(2000);

    this.battle(true);
  }

  async startRandom() {
    this.character = await this.getCharacter();

    if (!this.character) {
      return this.message.channel.send("You haven't registered yet!");
    }

    if (set.has(this.user.id)) {
      return this.message.reply("You are already in a battle!");
    }

    set.add(this.user.id);

    this.opponent = await this.getRandomOpponent();

    this.character.maxHp = this.character.hp;
    this.opponent.maxHp = this.opponent.hp;

    this.character.crit = 0;
    this.opponent.crit = 0;

    this.opponent.weight = 0;
    this.character.weight = 0;

    await this.registerEquipments();

    if (this.character.agl === this.opponent.agl) {
      this.character.agl += Math.random();
      this.opponent.agl += Math.random();
    }

    this.battleMessage = await this.message.channel.send({
      embeds: [this.battleEmbed()],
    });

    setTimeout(2000);

    this.battle(false);
  }

  async battle(custom) {
    // DMG = ATT * ATT / (ATT + DEF)

    if (this.character.agl > this.opponent.agl) {
      this.playerAttack();

      await setTimeout(1500);

      if (this.opponent.hp < 1) {
        return this.end(custom);
      }

      this.battleMessage.edit({ embeds: [this.battleEmbed()] });

      this.opponentAttack();

      await setTimeout(1500);

      if (this.character.hp < 1) {
        return this.end();
      }

      this.battleMessage.edit({ embeds: [this.battleEmbed()] });
    } else {
      this.opponentAttack();

      await setTimeout(1500);

      if (this.character.hp < 1) {
        return this.end(custom);
      }

      this.battleMessage.edit({ embeds: [this.battleEmbed()] });

      this.playerAttack();

      await setTimeout(1500);

      if (this.opponent.hp < 1) {
        return this.end(custom);
      }

      this.battleMessage.edit({ embeds: [this.battleEmbed()] });
    }

    this.battle(custom);
  }

  async end(custom) {
    let xpGain = 0;
    let rewardGained = 0;

    if (this.character.hp < 1) {
      set.delete(this.user.id);

      this.character.hp = 0;

      const battleEmbed = this.battleEmbed()
        .setFooter({ text: "You lost!" })
        .setDescription("```\nBattle ended!\n```");

      this.battleMessage.edit({ embeds: [battleEmbed] });
    } else {
      set.delete(this.user.id);

      this.opponent.hp = 0;

      const battleEmbed = this.battleEmbed();

      if (!custom) {
        xpGain = await this.registerXP();
        rewardGained = await this.registerReward();
      }

      battleEmbed
        .setFooter({
          text: `You Win! You gained ${xpGain} XP and ${rewardGained.toLocaleString()} coins!`,
        })
        .setDescription("```\nBattle ended!\n```");

      this.battleMessage.edit({ embeds: [battleEmbed] });
    }
  }

  async registerXP() {
    // formular: 1 * (5 * (O - P) / P + 4)

    // eslint-disable-next-line no-unused-vars
    let { id, userID, createdAt, updatedAt, ...character } =
      await this.getCharacter();

    let xpGain = Math.floor(
      1 *
        ((5 * (this.opponent.level - this.character.level)) /
          this.character.level +
          4),
    );

    if (xpGain < 1) xpGain = 1;

    character.xp += xpGain;

    schemas.character().update(
      {
        xp: character.xp,
      },
      { where: { userID: this.user.id } },
    );

    // eslint-disable-next-line no-unused-vars
    let { xp, ...attr } = character;

    let hpGain = 0;
    let strGain = 0;
    let aglGain = 0;
    let attGain = 0;
    let staGain = 0;
    let accGain = 0;

    switch (this.character.class) {
      case "warrior": {
        accGain = 3;
        break;
      }
      case "fox": {
        accGain = 5;
        break;
      }
      case "ghost": {
        accGain = 3;
        break;
      }
      default:
        accGain = 0;
        break;
    }

    while (character.xp > attr.xpNeeded) {
      attr.level++;
      attr.xpNeeded *= 2;

      hpGain += Math.floor(character.sta / 4) + 1;
      strGain += Math.floor(Math.random() * 2) + 1;
      aglGain += Math.floor(Math.random() * 2) + 1;
      staGain += Math.floor(Math.random() * 2) + 1;

      attr.att = attr.str / 2;

      if (this.character.att !== attr.att) {
        // eslint-disable-next-line no-unused-vars
        attGain = attr.att - this.character.att;
      }
    }

    if (this.character.level !== attr.level) {
      attr.hp += hpGain;
      attr.str += strGain;
      attr.agl += aglGain;
      attr.sta += staGain;

      if (attr.acc < 100) {
        if (Math.random() < 0.125) {
          attr.acc += accGain;
        } else {
          accGain = 0;
        }
      } else {
        attr.acc = 99;
      }

      schemas.character().update(attr, { where: { userID: this.user.id } });

      const embed = new Discord.EmbedBuilder()
        .setAuthor({
          name: this.user.username,
          iconURL: this.user.displayAvatarURL(),
        })
        .setColor("#DDA0DD")
        .setTitle("Level Up!")
        .setThumbnail(this.character.img)
        .setDescription(
          `Your character has leveled up to **level ${attr.level}**!\n\n**• HP:** +${hpGain}\n**• STR:** +${strGain}\n**• AGL:** +${aglGain}\n**• STA:** +${staGain}\n**• ACC:** +${accGain}`,
        );

      this.message.channel.send({ embeds: [embed] });
    }

    return xpGain;
  }

  async registerEquipments() {
    const register = (player, opponent, type) => {
      const playerEquip = JSON.parse(player.equipments);
      const opponentEquip = JSON.parse(opponent.equipments);

      if (playerEquip[type].equipped) {
        const attr = equipments[type][playerEquip[type].equipped].attr;
        const passive = equipments[type][playerEquip[type].equipped].passive;

        if (passive) {
          this.playerPassives.push(passive);
        }

        Object.keys(attr).forEach((key) => {
          player[key] += attr[key];
        });

        if (equipments[type][playerEquip[type].equipped].weight) {
          player.weight += equipments[type][playerEquip[type].equipped].weight;
        }
      }

      if (opponentEquip[type].equipped) {
        const attr = equipments[type][opponentEquip[type].equipped].attr;
        const passive = equipments[type][opponentEquip[type].equipped].passive;

        if (passive) {
          this.opponentPassives.push(passive);
        }

        Object.keys(attr).forEach((key) => {
          opponent[key] += attr[key];
        });

        if (equipments[type][opponentEquip[type].equipped].weight) {
          opponent.weight +=
            equipments[type][opponentEquip[type].equipped].weight;
        }
      }
    };

    register(this.character, this.opponent, "weapons");
    register(this.character, this.opponent, "shields");
    register(this.character, this.opponent, "helmet");
    register(this.character, this.opponent, "armor");
    register(this.character, this.opponent, "gloves");
  }

  async registerReward() {
    const wallet = await economies.getCoins(this.user);

    const reward =
      Math.ceil(Math.random() * 10) *
      Math.max(1, this.opponent.level - this.character.level);

    schemas.coins().update(
      {
        wallet: wallet.get("wallet") + reward,
      },
      {
        where: { userID: this.user.id },
      },
    );

    return reward;
  }

  playerAttack() {
    const acc = Math.floor(
      (this.character.acc / 100) *
        Math.floor(
          (this.character.att * this.character.att) /
            (this.character.att + this.opponent.def),
        ),
    );

    const dmg = Math.floor(
      (this.character.att * this.character.att) /
        (this.character.att + this.opponent.def),
    );

    let playerDmg = Math.floor(Math.random() * (dmg - acc + 1) + acc) + 1;

    const opponentSuccess =
      Math.random() < (this.opponent.eva - this.opponent.weight) / 100;

    if (opponentSuccess) {
      const crit = (this.character.crit + 1) / 201 / 100;
      const passives = this.playerPassives;

      if (passives) {
        for (const passive of passives) {
          const success = Math.random() < passive.rate / 100;

          if (success) {
            if (passive.action === "deduce") {
              for (const key in passive) {
                if (
                  key !== "action" &&
                  key !== "rate" &&
                  key !== "description"
                ) {
                  this.opponent[key] -= passive[key];
                }
              }
            }

            if (passive.action === "add") {
              for (const key in passive) {
                if (
                  key !== "action" &&
                  key !== "rate" &&
                  key !== "description"
                ) {
                  this.character[key] += passive[key];
                }
              }
            }
          }
        }
      }

      if (this.character.crit > 0 && Math.random() < crit) {
        this.opponent.hp -= playerDmg + playerDmg;
        this.actions.push(
          `${this.character.name} attacked ${this.opponent.name} and did ${playerDmg} damage. Its a critical hit!`,
        );
      } else {
        this.opponent.hp -= playerDmg;
        this.actions.push(
          `${this.character.name} attacked ${this.opponent.name} and did ${playerDmg} damage!`,
        );
      }
    } else {
      this.actions.push(`${this.opponent.name} avoided the attack!`);
    }
  }

  opponentAttack() {
    const acc = Math.floor(
      (this.opponent.acc / 100) *
        Math.floor(
          (this.opponent.att * this.opponent.att) /
            (this.opponent.att + this.opponent.def),
        ),
    );

    const dmg = Math.floor(
      (this.opponent.att * this.opponent.att) /
        (this.opponent.att + this.character.def),
    );

    const opponentDmg = Math.floor(Math.random() * (dmg - acc + 1) + acc) + 1;

    const playerSuccess =
      Math.random() < (this.character.eva - this.character.weight) / 100;

    if (playerSuccess) {
      const crit = (this.opponent.crit + 1) / 201 / 100;
      const passives = this.opponentPassives;

      if (passives) {
        for (const passive of passives) {
          const success = Math.random() < passive.rate / 100;

          if (success) {
            if (passive.action === "deduce") {
              for (const key in passive) {
                if (
                  key !== "action" &&
                  key !== "rate" &&
                  key !== "description"
                ) {
                  this.character[key] -= passive[key];
                }
              }
            }

            if (passive.action === "add") {
              for (const key in passive) {
                if (
                  key !== "action" &&
                  key !== "rate" &&
                  key !== "description"
                ) {
                  this.opponent[key] += passive[key];
                }
              }
            }
          }
        }
      }

      if (this.opponent.crit > 0 && Math.random() < crit) {
        this.character.hp -= opponentDmg + opponentDmg;
        this.actions.push(
          `${this.opponent.name} attacked ${this.character.name} and did ${opponentDmg} damage. Its a critical hit!`,
        );
      } else {
        this.character.hp -= opponentDmg;
        this.actions.push(
          `${this.opponent.name} attacked ${this.character.name} and did ${opponentDmg} damage!`,
        );
      }
    } else {
      this.actions.push(`${this.character.name} avoided the attack!`);
    }
  }

  battleEmbed() {
    let actionShow = `${this.actions.length} - ${
      this.actions[this.actions.length - 1]
    }`;

    // TODO: Get assets for every weapons
    // TODO: Display weapon icons on the embed

    // const playerEquipments = JSON.parse(this.character.equipments);
    // const opponentEquipments = JSON.parse(this.opponent.equipments);

    // let playerEquipped = [];
    // let opponentEquipped = [];

    // ["weapon", "shields", "helmet", "armor", "gloves"].forEach((e) => {
    //   playerEquipped.push(playerEquipments[e].equipped);
    //   opponentEquipped.push(opponentEquipments[e].equipped);
    // });

    return new Discord.EmbedBuilder()
      .setAuthor({
        name: this.user.username,
        iconURL: this.user.displayAvatarURL(),
      })
      .setImage(this.opponent.img)
      .setThumbnail(this.character.img)
      .setColor("#DDA0DD")
      .setDescription(`\`\`\`\n${actionShow}\n\`\`\``)
      .addFields([
        {
          name: `${this.character.name}`,
          value: `**• ${constants.assets.xp.emoji} Level:** ${this.character.level}\n**• ${constants.assets.hp.emoji} HP:** ${this.character.hp}`,
          inline: true,
        },
        {
          name: `${this.opponent.name}`,
          value: `**• ${constants.assets.xp.emoji} Level:** ${this.opponent.level}\n**• ${constants.assets.hp.emoji} HP:** ${this.opponent.hp}`,
          inline: true,
        },
      ]);
  }
}

module.exports = Battle;
