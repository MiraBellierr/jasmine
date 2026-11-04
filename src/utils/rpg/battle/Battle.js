const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  escapeMarkdown,
} = require("discord.js");
const { setTimeout: delay } = require("timers/promises");
const schemas = require("../../../database/schemas");
const equipments = require("../../../database/json/equipments.json");
const characters = require("../../../database/json/characters.json");
const economies = require("../../economies");
const { normalizeEquipments } = require("../data");
const {
  BATTLE_COLOR,
  ERROR_COLOR,
  GOLD_COLOR,
  SUCCESS_COLOR,
  commandHint,
  displayName,
  errorEmbed,
  formatCoins,
  formatStats,
  progressBar,
} = require("../ui");

const activeBattles = new Set();
const CHALLENGE_TIME = 180_000;

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 3)}...` : text;

class Battle {
  constructor(client, message, user) {
    this.client = client;
    this.user = user;
    this.message = message;
    this.actions = [];
    this.playerPassives = [];
    this.opponentPassives = [];
    this.opponentUser = null;
    this.opponentUserId = null;
    this.round = 0;
  }

  async getCharacter() {
    const character = await schemas.character().findOne({
      where: { userID: this.user.id },
    });

    return character ? character.toJSON() : null;
  }

  async getOpponentCharacter(user) {
    const character = await schemas
      .character()
      .findOne({ where: { userID: user.id } });

    if (!character) {
      return null;
    }

    this.opponentUserId = user.id;
    this.opponentUser = await this.client.users
      .fetch(user.id)
      .catch(() => null);

    return character.toJSON();
  }

  async getRandomOpponent() {
    const allCharacters = await schemas.character().findAll();
    const available = allCharacters.filter(
      (character) =>
        character.get("userID") !== this.user.id &&
        !activeBattles.has(character.get("userID")),
    );

    if (!available.length) {
      return null;
    }

    const character = available[Math.floor(Math.random() * available.length)];

    this.opponentUserId = character.get("userID");
    this.opponentUser = await this.client.users
      .fetch(character.get("userID"))
      .catch(() => null);

    return character.toJSON();
  }

  sendError(title, description) {
    return this.message.reply({
      embeds: [errorEmbed(this.client, title, description)],
    });
  }

  release() {
    activeBattles.delete(this.user.id);

    if (this.opponentUserId) {
      activeBattles.delete(this.opponentUserId);
    }
  }

  challengeRow(disabled = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("battle:accept")
        .setLabel("Accept")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("battle:decline")
        .setLabel("Decline")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    );
  }

  async confirmBattle(opponent) {
    const challengerName = displayName(this.user);
    const opponentName = displayName(opponent);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Battle",
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setColor(BATTLE_COLOR)
      .setTitle("Battle challenge")
      .setDescription(
        `${challengerName} wants to battle ${opponentName}. Accept to start. The challenge expires in 3 minutes.`,
      )
      .setTimestamp();

    const response = await this.message.channel.send({
      content: `${opponent}`,
      embeds: [embed],
      components: [this.challengeRow()],
    });

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: (interaction) => interaction.user.id === opponent.id,
        time: CHALLENGE_TIME,
      });
      const accepted = confirmation.customId === "battle:accept";
      const result = new EmbedBuilder()
        .setAuthor({
          name: "Battle",
          iconURL: this.client.user.displayAvatarURL(),
        })
        .setColor(accepted ? SUCCESS_COLOR : ERROR_COLOR)
        .setTitle(accepted ? "Challenge accepted" : "Challenge declined")
        .setDescription(
          accepted
            ? `${opponentName} accepted ${challengerName}'s challenge.`
            : `${opponentName} declined ${challengerName}'s challenge.`,
        )
        .setTimestamp();

      await confirmation.update({
        content: " ",
        embeds: [result],
        components: [this.challengeRow(true)],
      });

      return accepted;
    } catch {
      await response
        .edit({
          content: `${opponent}`,
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: "Battle",
                iconURL: this.client.user.displayAvatarURL(),
              })
              .setColor(GOLD_COLOR)
              .setTitle("Challenge expired")
              .setDescription(`${opponentName} did not answer in time.`)
              .setTimestamp(),
          ],
          components: [this.challengeRow(true)],
        })
        .catch(() => null);

      return false;
    }
  }

  async prepareBattle() {
    this.character.maxHp = this.character.hp;
    this.opponent.maxHp = this.opponent.hp;
    this.character.crit = 0;
    this.opponent.crit = 0;
    this.character.weight = 0;
    this.opponent.weight = 0;

    await this.registerEquipments();

    if (this.character.agl === this.opponent.agl) {
      this.character.agl += Math.random();
      this.opponent.agl += Math.random();
    }

    this.actions = [
      `${escapeMarkdown(this.character.name)} faced ${escapeMarkdown(
        this.opponent.name,
      )}.`,
    ];
    this.battleMessage = await this.message.channel.send({
      embeds: [this.battleEmbed()],
    });

    await delay(2000);
  }

  async startOpponent(opponent) {
    this.character = await this.getCharacter();

    if (!this.character) {
      return this.sendError(
        "Not registered",
        `You are not registered. Register with ${commandHint(
          this.client,
          this.message,
          "register",
          "<class>",
        )} to battle.`,
      );
    }

    if (activeBattles.has(this.user.id)) {
      return this.sendError(
        "Already in a battle",
        "Finish your current battle before starting another.",
      );
    }

    if (opponent.id === this.user.id) {
      return this.sendError(
        "Invalid opponent",
        "You cannot battle yourself. Choose another member.",
      );
    }

    if (activeBattles.has(opponent.id)) {
      return this.sendError(
        "Opponent is busy",
        `${displayName(opponent)} is already in a battle.`,
      );
    }

    this.opponent = await this.getOpponentCharacter(opponent);

    if (!this.opponent) {
      return this.sendError(
        "Opponent not registered",
        `${displayName(opponent)} does not have a character yet.`,
      );
    }

    const accepted = await this.confirmBattle(opponent);

    if (!accepted) {
      return;
    }

    if (activeBattles.has(this.user.id) || activeBattles.has(opponent.id)) {
      return this.sendError(
        "Battle unavailable",
        "One of the players is already in a battle. Try again when it ends.",
      );
    }

    activeBattles.add(this.user.id);
    activeBattles.add(opponent.id);

    try {
      await this.prepareBattle();
      await this.runBattle(true);
    } catch (error) {
      this.release();
      throw error;
    }
  }

  async startRandom() {
    this.character = await this.getCharacter();

    if (!this.character) {
      return this.sendError(
        "Not registered",
        `You are not registered. Register with ${commandHint(
          this.client,
          this.message,
          "register",
          "<class>",
        )} to battle.`,
      );
    }

    if (activeBattles.has(this.user.id)) {
      return this.sendError(
        "Already in a battle",
        "Finish your current battle before starting another.",
      );
    }

    this.opponent = await this.getRandomOpponent();

    if (!this.opponent) {
      return this.sendError(
        "No opponents",
        `No other registered characters are available. Challenge a member with ${commandHint(
          this.client,
          this.message,
          "battle",
          "<member>",
        )}.`,
      );
    }

    activeBattles.add(this.user.id);

    if (this.opponentUserId) {
      activeBattles.add(this.opponentUserId);
    }

    try {
      await this.prepareBattle();
      await this.runBattle(false);
    } catch (error) {
      this.release();
      throw error;
    }
  }

  async runBattle(memberBattle) {
    try {
      await this.battle(memberBattle);
    } finally {
      this.release();
    }
  }

  async battle(memberBattle) {
    this.round += 1;

    if (this.character.agl > this.opponent.agl) {
      this.playerAttack();
      await delay(1500);

      if (this.opponent.hp < 1) {
        return this.end(memberBattle);
      }

      await this.updateBattle();

      this.opponentAttack();
      await delay(1500);

      if (this.character.hp < 1) {
        return this.end(memberBattle);
      }

      await this.updateBattle();
    } else {
      this.opponentAttack();
      await delay(1500);

      if (this.character.hp < 1) {
        return this.end(memberBattle);
      }

      await this.updateBattle();

      this.playerAttack();
      await delay(1500);

      if (this.opponent.hp < 1) {
        return this.end(memberBattle);
      }

      await this.updateBattle();
    }

    return this.battle(memberBattle);
  }

  async updateBattle() {
    await this.battleMessage
      .edit({ embeds: [this.battleEmbed()] })
      .catch(() => null);
  }

  async end(memberBattle) {
    const won = this.character.hp >= 1;

    if (won) {
      this.opponent.hp = 0;
    } else {
      this.character.hp = 0;
    }

    let xpGain = 0;
    let reward = 0;

    if (won && !memberBattle) {
      xpGain = await this.registerXP();
      reward = await this.registerReward();
    }

    const playerName = escapeMarkdown(this.character.name);
    const opponentName = escapeMarkdown(this.opponent.name);
    const result = won
      ? memberBattle
        ? "No rewards for member battles."
        : `XP +${xpGain}\n${formatCoins(reward)}`
      : "No rewards.";

    const embed = this.battleEmbed()
      .setColor(won ? SUCCESS_COLOR : ERROR_COLOR)
      .setTitle(won ? "Victory" : "Defeat")
      .setDescription(
        won
          ? `${playerName} defeated ${opponentName}.`
          : `${opponentName} defeated ${playerName}.`,
      )
      .addFields({ name: "Result", value: result })
      .setFooter({
        text: "Battle ended",
        iconURL: this.client.user.displayAvatarURL(),
      });

    await this.battleMessage.edit({ embeds: [embed] }).catch(() => null);
  }

  async registerXP() {
    // eslint-disable-next-line no-unused-vars
    let { id, userID, createdAt, updatedAt, ...character } =
      await this.getCharacter();

    const xpGain = Math.max(
      1,
      Math.ceil(
        (5 * (this.opponent.level - this.character.level)) /
          this.character.level +
          4 +
          this.opponent.level,
      ),
    );

    character.xp += xpGain;

    await schemas
      .character()
      .update({ xp: character.xp }, { where: { userID: this.user.id } });

    // eslint-disable-next-line no-unused-vars
    let { xp, ...attr } = character;

    let hpGain = 0;
    let strGain = 0;
    let aglGain = 0;
    let staGain = 0;

    while (character.xp >= attr.xpNeeded) {
      attr.level++;
      attr.xpNeeded += Math.ceil(attr.xpNeeded * 2 * 0.1) + 4;

      hpGain += Math.floor(character.sta / 4) + 1;
      strGain += Math.floor(Math.random() * 2) + 1;
      aglGain += Math.floor(Math.random() * 2) + 1;
      staGain += Math.floor(Math.random() * 2) + 1;

      attr.att = attr.str / 2;
    }

    if (this.character.level !== attr.level) {
      attr.hp += hpGain;
      attr.str += strGain;
      attr.agl += aglGain;
      attr.sta += staGain;

      await schemas
        .character()
        .update(attr, { where: { userID: this.user.id } });

      const portrait = characters[this.character.img]?.image;
      const embed = new EmbedBuilder()
        .setAuthor({
          name: displayName(this.user),
          iconURL: this.user.displayAvatarURL(),
        })
        .setColor(SUCCESS_COLOR)
        .setTitle("Level up")
        .setDescription(
          `${escapeMarkdown(this.character.name)} reached level ${attr.level}.`,
        )
        .addFields({
          name: "Stat gains",
          value: formatStats({
            hp: hpGain,
            str: strGain,
            agl: aglGain,
            sta: staGain,
          }),
        })
        .setFooter({
          text: "Jasmine RPG",
          iconURL: this.client.user.displayAvatarURL(),
        })
        .setTimestamp();

      if (portrait) {
        embed.setThumbnail(portrait);
      }

      await this.message.channel.send({ embeds: [embed] });
    }

    return xpGain;
  }

  async registerEquipments() {
    const register = (player, opponent, type) => {
      const playerEquipments = normalizeEquipments(player.equipments);
      const opponentEquipments = normalizeEquipments(opponent.equipments);
      const playerItem = equipments[type]?.[playerEquipments[type]?.equipped];
      const opponentItem =
        equipments[type]?.[opponentEquipments[type]?.equipped];

      if (playerItem) {
        if (playerItem.passive) {
          this.playerPassives.push(playerItem.passive);
        }

        for (const [key, value] of Object.entries(playerItem.attr)) {
          player[key] += value;
        }

        if (playerItem.weight) {
          player.weight += playerItem.weight;
        }
      }

      if (opponentItem) {
        if (opponentItem.passive) {
          this.opponentPassives.push(opponentItem.passive);
        }

        for (const [key, value] of Object.entries(opponentItem.attr)) {
          opponent[key] += value;
        }

        if (opponentItem.weight) {
          opponent.weight += opponentItem.weight;
        }
      }
    };

    for (const type of ["weapons", "shields", "helmet", "armor", "gloves"]) {
      register(this.character, this.opponent, type);
    }
  }

  async registerReward() {
    const wallet = await economies.getCoins(this.user);
    const reward =
      Math.ceil(Math.random() * 10) *
      Math.max(1, this.opponent.level - this.character.level);

    await schemas
      .coins()
      .update(
        { wallet: wallet.get("wallet") + reward },
        { where: { userID: this.user.id } },
      );

    return reward;
  }

  runPassives(passives, attacker, defender) {
    for (const passive of passives) {
      if (Math.random() >= passive.rate / 100) {
        continue;
      }

      for (const [key, value] of Object.entries(passive)) {
        if (["action", "rate", "description"].includes(key)) {
          continue;
        }

        if (passive.action === "deduce") {
          defender[key] -= value;
        } else if (passive.action === "add") {
          attacker[key] += value;
        }
      }
    }
  }

  playerAttack() {
    const accuracy = Math.floor(
      (this.character.acc / 100) *
        Math.floor(
          (this.character.att * this.character.att) /
            (this.character.att + this.opponent.def),
        ),
    );
    const damage = Math.floor(
      (this.character.att * this.character.att) /
        (this.character.att + this.opponent.def),
    );
    const rolled =
      Math.floor(Math.random() * (damage - accuracy + 1) + accuracy) + 1;
    const landed =
      Math.random() < (this.opponent.eva - this.opponent.weight) / 100;

    if (!landed) {
      this.actions.push(
        `${escapeMarkdown(this.opponent.name)} avoided ${escapeMarkdown(
          this.character.name,
        )}'s attack.`,
      );
      return;
    }

    this.runPassives(this.playerPassives, this.character, this.opponent);

    const crit = (this.character.crit + 1) / 201 / 100;
    const critical = this.character.crit > 0 && Math.random() < crit;
    const dealt = critical ? rolled * 2 : rolled;

    this.opponent.hp -= dealt;
    this.actions.push(
      `${escapeMarkdown(this.character.name)} hit ${escapeMarkdown(
        this.opponent.name,
      )} for ${dealt} damage.${critical ? " Critical hit." : ""}`,
    );
  }

  opponentAttack() {
    const accuracy = Math.floor(
      (this.opponent.acc / 100) *
        Math.floor(
          (this.opponent.att * this.opponent.att) /
            (this.opponent.att + this.opponent.def),
        ),
    );
    const damage = Math.floor(
      (this.opponent.att * this.opponent.att) /
        (this.opponent.att + this.character.def),
    );
    const rolled =
      Math.floor(Math.random() * (damage - accuracy + 1) + accuracy) + 1;
    const landed =
      Math.random() < (this.character.eva - this.character.weight) / 100;

    if (!landed) {
      this.actions.push(
        `${escapeMarkdown(this.character.name)} avoided ${escapeMarkdown(
          this.opponent.name,
        )}'s attack.`,
      );
      return;
    }

    this.runPassives(this.opponentPassives, this.opponent, this.character);

    const crit = (this.opponent.crit + 1) / 201 / 100;
    const critical = this.opponent.crit > 0 && Math.random() < crit;
    const dealt = critical ? rolled * 2 : rolled;

    this.character.hp -= dealt;
    this.actions.push(
      `${escapeMarkdown(this.opponent.name)} hit ${escapeMarkdown(
        this.character.name,
      )} for ${dealt} damage.${critical ? " Critical hit." : ""}`,
    );
  }

  battleEmbed() {
    const playerName = truncate(escapeMarkdown(this.character.name), 80);
    const opponentName = truncate(escapeMarkdown(this.opponent.name), 80);
    const playerHeading = truncate(
      `${playerName} (${displayName(this.user)})`,
      256,
    );
    const opponentHeading = this.opponentUser
      ? truncate(`${opponentName} (${displayName(this.opponentUser)})`, 256)
      : opponentName;
    const recent = this.actions
      .slice(-4)
      .map((action) => `• ${truncate(action, 200)}`)
      .join("\n");
    const playerPortrait = characters[this.character.img]?.image;
    const opponentPortrait = characters[this.opponent.img]?.image;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Battle",
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setColor(BATTLE_COLOR)
      .setTitle(truncate(`${playerName} vs ${opponentName}`, 256))
      .addFields(
        {
          name: playerHeading,
          value: `Level ${this.character.level}\n${progressBar(
            Math.max(0, this.character.hp),
            this.character.maxHp,
          )}`,
          inline: true,
        },
        {
          name: opponentHeading,
          value: `Level ${this.opponent.level}\n${progressBar(
            Math.max(0, this.opponent.hp),
            this.opponent.maxHp,
          )}`,
          inline: true,
        },
        {
          name: "Recent actions",
          value: recent || "No actions yet.",
        },
      )
      .setFooter({
        text: `Round ${Math.max(1, this.round)}`,
        iconURL: this.client.user.displayAvatarURL(),
      });

    if (playerPortrait) {
      embed.setThumbnail(playerPortrait);
    }

    if (opponentPortrait) {
      embed.setImage(opponentPortrait);
    }

    return embed;
  }
}

module.exports = Battle;
